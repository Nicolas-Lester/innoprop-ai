import {
  Controller,
  Get,
  Post,
  Body,
  HttpException,
  HttpStatus,
  UseGuards, 
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport'; 
import { AppService } from './app.service';
import { AIService } from './ai.service';
import { PrismaService } from './prisma.service';
import { EmailService } from './email.service';
import { AnalyzeTicketDto } from './dto/analyze-ticket.dto';
import { ApiOperation, ApiResponse, ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { GetUser } from './common/decorators/get-user.decorator';

@ApiTags('Tickets')
@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly aiService: AIService,
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
  ) {}

  @Get()
  getHello() {
    return this.appService.getHello();
  }

  @UseGuards(AuthGuard('jwt')) // <--- AGREGADO: Ahora ver tickets requiere estar logueado
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

      return {
        success: true,
        count: tickets.length,
        data: tickets,
      };
    } catch (error) {
      throw new HttpException(
        'Error al recuperar los tickets de la base de datos',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @Post('ticket/analyze')
  @ApiOperation({ summary: 'Analiza un ticket usando IA y lo guarda en la DB' })
  @ApiResponse({ status: 201, description: 'Ticket procesado y guardado con éxito.' })
  @ApiResponse({ status: 400, description: 'Datos de entrada inválidos.' })
  async analyze(
    @Body() body: AnalyzeTicketDto,
    @GetUser() user: any // <--- Aquí ya tenemos al usuario (userId y email)
  ) {
    const { description } = body;

    try {
      const analysisString = await this.aiService.analyzeTicket(description);
      const cleanJson = analysisString.replace(/```json|```/g, '').trim();
      const analysis = JSON.parse(cleanJson);

      // 3. Persistencia con VÍNCULO AL USUARIO
      const newTicket = await this.prisma.ticket.create({
        data: {
          description,
          category: analysis.categoria,
          priority: analysis.prioridad,
          aiSummary: analysis.resumen,
          status: 'OPEN',
          reporterId: user.userId, // <--- ¡ESTO ES LO QUE FALTABA CONECTAR!
        },
      });

      let notified = false;
      const isUrgent = ['ALTA', 'CRITICA'].includes(analysis.prioridad);

      if (isUrgent) {
        await this.emailService.sendUrgentNotification(
          analysis.categoria,
          analysis.resumen,
          analysis.prioridad,
        );
        notified = true;
      }

      return {
        success: true,
        message: 'Ticket procesado y guardado correctamente',
        data: {
          id: newTicket.id,
          categoria: newTicket.category,
          prioridad: newTicket.priority,
          notificado: notified,
          usuario: user.email // Para confirmar en la respuesta
        },
        suggestions: analysis.pasos_sugeridos || [],
      };
    } catch (error) {
      console.error('Error en el proceso de análisis:', error);
      throw new HttpException(
        'Error interno al procesar el ticket.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @Get('tickets/me')
  @ApiOperation({ summary: 'Obtiene solo los tickets creados por el usuario logueado' })
  @ApiResponse({ status: 200, description: 'Lista de tus tickets recuperada.' })
  async getMyTickets(@GetUser('userId') userId: string) {
    try {
      const tickets = await this.prisma.ticket.findMany({
        where: { 
          reporterId: userId // <--- Aquí ocurre el filtro de seguridad
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      return {
        success: true,
        count: tickets.length,
        data: tickets,
      };
    } catch (error) {
      throw new HttpException(
        'Error al recuperar tus tickets',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}