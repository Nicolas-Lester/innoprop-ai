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
    private readonly aiService: AIService, // Inyectamos el servicio de IA
    private readonly prisma: PrismaService, // Inyectamos el servicio de Prisma
    private readonly emailService: EmailService, // Inyectamos el servicio de Email
  ) {}

  @Get()
  getHello() {
    return this.appService.getHello();
  }

  @Post('ticket/analyze')
  async analyze(@Body('description') description: string) {
    const analysisString = await this.aiService.analyzeTicket(description);
    const analysis = JSON.parse(
      analysisString.replace(/```json|```/g, '').trim(),
    );

    // 1. Guardar en DB (lo que ya tienes)
    const newTicket = await this.prisma.ticket.create({
      data: {
        description,
        category: analysis.categoria,
        priority: analysis.prioridad,
        aiSummary: analysis.resumen,
        status: 'OPEN',
      },
    });

    // 2. Lógica de Negocio: Notificar si es grave
    if (['ALTA', 'CRITICA'].includes(analysis.prioridad)) {
      await this.emailService.sendUrgentNotification(
        analysis.categoria,
        analysis.resumen,
        analysis.prioridad,
      );
    }

    return {
      message: 'Ticket procesado con éxito',
      ticketId: newTicket.id,
      urgentNotified: ['ALTA', 'CRITICA'].includes(analysis.prioridad),
    };
  }
}
