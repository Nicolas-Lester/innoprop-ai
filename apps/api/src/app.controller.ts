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

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly aiService: AIService, // Inyectamos el servicio de IA
    private readonly prisma: PrismaService, // Inyectamos el servicio de Prisma
  ) {}

  @Get()
  getHello() {
    return this.appService.getHello();
  }

  @Post('ticket/analyze')
  async analyze(@Body('description') description: string) {
    // 1. Obtenemos el análisis de la IA
    const analysisString = await this.aiService.analyzeTicket(description);
    const analysis = JSON.parse(analysisString);

    // 2. Lo guardamos en Supabase usando Prisma
    const newTicket = await this.prisma.ticket.create({
      data: {
        description,
        category: analysis.categoria,
        priority: analysis.prioridad,
        aiSummary: analysis.resumen,
        status: 'OPEN',
        // ¡Eliminamos propertyId y reporterId de aquí para que no choquen con la DB!
      },
    });

    return {
      message: 'Ticket creado y analizado con éxito',
      data: newTicket,
      suggestions: analysis.pasos_sugeridos,
    };
  }
}
