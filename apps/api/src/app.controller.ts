import {
  Controller,
  Get,
  Post,
  Body,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { AppService } from './app.service';
import { AIService } from './ai.service';
import { PrismaService } from './prisma.service';
import { EmailService } from './email.service';

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

  @Post('ticket/analyze')
  async analyze(@Body() body: AnalyzeTicketDto) {
    // <--- Ahora usamos el DTO
    const { description } = body;
    // 1. Validación básica de entrada
    if (!description) {
      throw new HttpException(
        'La descripción es obligatoria',
        HttpStatus.BAD_REQUEST,
      );
    }

    try {
      // 2. Obtener y limpiar respuesta de la IA
      const analysisString = await this.aiService.analyzeTicket(description);
      const cleanJson = analysisString.replace(/```json|```/g, '').trim();
      const analysis = JSON.parse(cleanJson);

      // 3. Persistencia en Supabase via Prisma
      // Nota: propertyId y reporterId se omiten porque quedaron opcionales en el schema
      const newTicket = await this.prisma.ticket.create({
        data: {
          description,
          category: analysis.categoria,
          priority: analysis.prioridad,
          aiSummary: analysis.resumen,
          status: 'OPEN',
        },
      });

      // 4. Lógica de Notificación Automática
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

      // 5. Respuesta estructurada
      return {
        success: true,
        message: 'Ticket procesado y guardado correctamente',
        data: {
          id: newTicket.id,
          categoria: newTicket.category,
          prioridad: newTicket.priority,
          resumen: newTicket.aiSummary,
          notificado: notified,
        },
        suggestions: analysis.pasos_sugeridos || [],
      };
    } catch (error) {
      // Manejo de errores para evitar el 500 genérico si falla la IA o el JSON
      console.error('Error en el proceso de análisis:', error);
      throw new HttpException(
        'Error interno al procesar el ticket. Revisa los logs del servidor.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
