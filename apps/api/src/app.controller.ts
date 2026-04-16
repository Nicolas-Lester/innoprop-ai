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
import { AIService } from './ai.service';
import { PrismaService } from './prisma.service';
import { EmailService } from './email.service';
import { StorageService } from './storage.service';
import { AnalyzeTicketDto } from './dto/analyze-ticket.dto';
import { AnalyzeWithImageDto } from './dto/analyze-with-image.dto';
import { GetUser } from './common/decorators/get-user.decorator';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiBearerAuth,
  ApiConsumes,
  ApiBody,
  ApiQuery,
} from '@nestjs/swagger';

@ApiTags('Tickets')
@Controller()
export class AppController {
  constructor(
    private readonly aiService: AIService,
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
    private readonly storageService: StorageService,
  ) {}

  // 1. OBTENER MIS TICKETS (Con filtros inteligentes para el usuario)
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @Get('tickets/me')
  @ApiOperation({ summary: 'Obtiene tus tickets personales con filtros opcionales' })
  @ApiQuery({ name: 'priority', required: false, example: 'ALTA' })
  @ApiQuery({ name: 'status', required: false, example: 'OPEN' })
  @ApiResponse({ status: 200, description: 'Lista de tus tickets recuperada.' })
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

  // 2. ANALIZAR TICKET (Solo Texto)
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @Post('ticket/analyze')
  @ApiOperation({ summary: 'Analiza un ticket usando IA (Solo texto) y lo guarda' })
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
      throw new HttpException('Error al procesar el análisis de texto', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  // 3. ANALIZAR TICKET V2 (Imagen + Texto) - Soporta WEBP/JPG/PNG
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
  @ApiOperation({ summary: 'Analiza un ticket multimodal (Imagen + Texto) usando IA' })
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

      // 1. Subida a Storage
      if (file) {
        imageUrl = await this.storageService.uploadFile(file);
      }

      // 2. IA Vision (Gemini)
      const analysisString = file
        ? await this.aiService.analyzeTicketWithImage(body.description, file.buffer, file.mimetype)
        : await this.aiService.analyzeTicket(body.description);

      const analysis = JSON.parse(analysisString.replace(/```json|```/g, '').trim());

      // 3. DB
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

      // 4. Notificación
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
        `Error en el procesamiento multimodal: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}