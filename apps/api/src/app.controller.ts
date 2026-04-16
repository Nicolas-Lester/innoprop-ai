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
} from '@nestjs/common';
import 'multer';
import { AuthGuard } from '@nestjs/passport';
import { AppService } from './app.service';
import { AIService } from './ai.service';
import { PrismaService } from './prisma.service';
import { EmailService } from './email.service';
import { AnalyzeTicketDto } from './dto/analyze-ticket.dto';
import {
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiBearerAuth,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { GetUser } from './common/decorators/get-user.decorator';
import { FileInterceptor } from '@nestjs/platform-express';
import { StorageService } from './storage.service';
import { AnalyzeWithImageDto } from './dto/analyze-with-image.dto';

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

  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @Get('tickets')
  @ApiOperation({ summary: 'Obtiene el historial de tickets analizados' })
  @ApiResponse({ status: 200, description: 'Lista de tickets recuperada con éxito.' })
  async getTickets() {
    try {
      const tickets = await this.prisma.ticket.findMany({
        orderBy: { createdAt: 'desc' },
        take: 20,
      });
      return { success: true, count: tickets.length, data: tickets };
    } catch (error) {
      throw new HttpException('Error al recuperar los tickets', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @Post('ticket/analyze')
  @ApiOperation({ summary: 'Analiza un ticket usando IA y lo guarda en la DB' })
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
      throw new HttpException('Error interno', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @Get('tickets/me')
  @ApiOperation({ summary: 'Obtiene solo los tickets creados por el usuario logueado' })
  async getMyTickets(@GetUser('userId') userId: string) {
    try {
      const tickets = await this.prisma.ticket.findMany({
        where: { reporterId: userId },
        orderBy: { createdAt: 'desc' },
      });
      return { success: true, count: tickets.length, data: tickets };
    } catch (error) {
      throw new HttpException('Error al recuperar tus tickets', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  // --- MÉTODO ACTUALIZADO CON LOGS ---
  @Post('ticket/analyze-v2')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @UseInterceptors(FileInterceptor('image'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: AnalyzeWithImageDto })
  @ApiOperation({ summary: 'Analiza un ticket con texto e imagen usando IA Multimodal' })
  async analyzeWithImage(
    @Body() body: any,
    @UploadedFile() file: Express.Multer.File,
    @GetUser() user: any,
  ) {
    let imageUrl: string | null = null;

    try {
      // 1. Validar entrada
      if (!body.description) {
        throw new HttpException('La descripción es obligatoria', HttpStatus.BAD_REQUEST);
      }

      // 2. Subir imagen si existe
      if (file) {
        imageUrl = await this.storageService.uploadFile(file);
      }

      // 3. Análisis IA Multimodal
      const analysisString = file
        ? await this.aiService.analyzeTicketWithImage(body.description, file.buffer, file.mimetype)
        : await this.aiService.analyzeTicket(body.description);

      const analysis = JSON.parse(analysisString.replace(/```json|```/g, '').trim());

      // 4. Guardar en Base de Datos
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

      // 5. Notificación Urgente
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

    } catch (error) {
      // --- AQUÍ ESTÁ EL LOG QUE REVELARÁ EL ERROR 500 ---
      console.error('--- [ERROR EN ANALYZE-V2] ---');
      console.error('Mensaje:', error.message);
      console.error('Stack:', error.stack);
      console.error('------------------------------');

      throw new HttpException(
        `Error al procesar el ticket: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}