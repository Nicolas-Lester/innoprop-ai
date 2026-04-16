import {
  Controller,
  Get,
  Post,
  Body,
  HttpException,
  HttpStatus,
  UseGuards,
  UploadedFile,
  UseInterceptors,
  Query,
} from '@nestjs/common';
import 'multer';
import { AuthGuard } from '@nestjs/passport';
import { AppService } from './app.service';
import { AIService } from './ai.service';
import { PrismaService } from './prisma.service';
import { EmailService } from './email.service';
import { AnalyzeTicketDto } from './dto/analyze-ticket.dto';
import { AnalyzeWithImageDto } from './dto/analyze-with-image.dto';
import {
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiBearerAuth,
  ApiConsumes,
  ApiBody,
  ApiQuery,
} from '@nestjs/swagger';
import { GetUser } from './common/decorators/get-user.decorator';
import { FileInterceptor } from '@nestjs/platform-express';
import { StorageService } from './storage.service';
import { RolesGuard } from './common/guards/roles.guard';
import { Roles } from './common/decorators/roles.decorator';

@ApiTags('Tickets')
@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly aiService: AIService,
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
    private readonly storageService: StorageService,
  ) {}

  @Get()
  getHello() {
    return this.appService.getHello();
  }

  // 1. Obtener historial global (Solo ADMIN)
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @Get('tickets')
  @ApiOperation({ summary: 'Obtiene el historial global (Solo ADMIN)' })
  @ApiResponse({ status: 200, description: 'Lista de tickets recuperada.' })
  async getTickets() {
    try {
      const tickets = await this.prisma.ticket.findMany({
        orderBy: { createdAt: 'desc' },
        take: 50,
        include: {
          reporter: { select: { email: true, name: true } }
        }
      });
      return { success: true, count: tickets.length, data: tickets };
    } catch (error) {
      throw new HttpException('Error al recuperar los tickets', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  // 2. Obtener tickets del usuario logueado (Con FILTROS inteligentes)
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @Get('tickets/me')
  @ApiOperation({ summary: 'Obtiene tus tickets con filtros opcionales' })
  @ApiQuery({ name: 'priority', required: false, example: 'ALTA' })
  @ApiQuery({ name: 'status', required: false, example: 'OPEN' })
  async getMyTickets(
    @GetUser('userId') userId: string,
    @Query('priority') priority?: string,
    @Query('status') status?: string,
  ) {
    try {
      const tickets = await this.prisma.ticket.findMany({
        where: { 
          reporterId: userId,
          ...(priority && { priority: { equals: priority, mode: 'insensitive' } }),
          ...(status && { status: { equals: status, mode: 'insensitive' } }),
        },
        orderBy: { createdAt: 'desc' },
      });
      return { success: true, count: tickets.length, data: tickets };
    } catch (error) {
      throw new HttpException('Error al recuperar tus tickets', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  // 3. Analizar ticket (Solo Texto)
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @Post('ticket/analyze')
  @ApiOperation({ summary: 'Analiza un ticket usando IA (Solo texto)' })
  async analyze(@Body() body: AnalyzeTicketDto, @GetUser() user: any) {
    const { description } = body;
    try {
      const analysisString = await this.aiService.analyzeTicket(description);
      const cleanJson = analysisString.replace(/```json|```/g, '').trim();
      const analysis = JSON.parse(cleanJson);

      const newTicket = await this.prisma.ticket.create({
        data: {
          description,
          category: analysis.categoria,
          priority: analysis.prioridad,
          aiSummary: analysis.resumen,
          status: 'OPEN',
          reporterId: user.userId,
        },
      });

      if (['ALTA', 'CRITICA'].includes(analysis.prioridad)) {
        await this.emailService.sendUrgentNotification(
          analysis.categoria,
          analysis.resumen,
          analysis.prioridad,
        );
      }

      return { success: true, data: newTicket, suggestions: analysis.pasos_sugeridos || [] };
    } catch (error) {
      console.error('Error en analyze:', error);
      throw new HttpException('Error interno al procesar texto', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  // 4. Analizar ticket V2 (Imagen + Texto) - Soporta WEBP
  @Post('ticket/analyze-v2')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @UseInterceptors(FileInterceptor('image', {
    fileFilter: (req, file, callback) => {
      if (!file.originalname.match(/\.(jpg|jpeg|png|webp)$/)) {
        return callback(new HttpException('Formato no soportado (Solo JPG, PNG, WEBP)', HttpStatus.BAD_REQUEST), false);
      }
      callback(null, true);
    },
  }))
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: AnalyzeWithImageDto })
  @ApiOperation({ summary: 'Analiza un ticket multimodal (Imagen + Texto)' })
  async analyzeWithImage(
    @Body() body: any,
    @UploadedFile() file: Express.Multer.File,
    @GetUser() user: any,
  ) {
    let imageUrl: string | null = null;

    try {
      if (!body.description) {
        throw new HttpException('La descripción es obligatoria', HttpStatus.BAD_REQUEST);
      }

      if (file) {
        imageUrl = await this.storageService.uploadFile(file);
      }

      const analysisString = file
        ? await this.aiService.analyzeTicketWithImage(body.description, file.buffer, file.mimetype)
        : await this.aiService.analyzeTicket(body.description);

      const analysis = JSON.parse(analysisString.replace(/```json|```/g, '').trim());

      const newTicket = await this.prisma.ticket.create({
        data: {
          description: body.description,
          category: analysis.categoria,
          priority: analysis.prioridad,
          aiSummary: analysis.resumen,
          status: 'OPEN',
          reporterId: user.userId,
          imageUrl: imageUrl,
        },
      });

      let notified = false;
      if (['ALTA', 'CRITICA'].includes(analysis.prioridad)) {
        await this.emailService.sendUrgentNotification(
          analysis.categoria,
          analysis.resumen,
          analysis.prioridad,
        );
        notified = true;
      }

      return {
        success: true,
        data: { ...newTicket, notified },
        analysis,
      };

    } catch (error: any) {
      console.error('--- [ERROR EN ANALYZE-V2] ---');
      console.error('Mensaje:', error.message);
      console.error('------------------------------');

      throw new HttpException(
        `Error al procesar el ticket: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}