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
        aiSummary: analysis.resumen, // <--- Cambiado de summary a aiSummary
        status: 'OPEN',
        // ⚠️ OJO: Tu esquema pide propertyId y reporterId obligatorios.
        // Para que no te dé error ahora, vamos a poner IDs de prueba
        // (Asegúrate de que estos IDs existan en tu DB o hazlos opcionales en el schema)
        propertyId: 'id-de-propiedad-de-prueba',
        reporterId: 'id-de-usuario-de-prueba',
      },
    });

    return {
      message: 'Ticket creado y analizado con éxito',
      data: newTicket,
      suggestions: analysis.pasos_sugeridos,
    };
  }
}
