import { Controller, Get, Post, Body, HttpException, HttpStatus } from '@nestjs/common';
import { AppService } from './app.service';
import { AIService } from './ai.service';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly aiService: AIService // Inyectamos el servicio de IA
  ) {}

  @Get()
  getHello() {
    return this.appService.getHello();
  }

  @Post('ticket/analyze')
  async analyze(@Body('description') description: string) {
    try {
      const analysis = await this.aiService.analyzeTicket(description);
      return JSON.parse(analysis);
    } catch (error: any) {
      // Quota excedida o rate limit de Gemini
      if (error?.status === 429 || error?.message?.includes('quota') || error?.message?.includes('RESOURCE_EXHAUSTED')) {
        throw new HttpException('Límite de uso de la IA alcanzado. Intenta en unos segundos.', HttpStatus.TOO_MANY_REQUESTS);
      }
      throw new HttpException(error?.message ?? 'Error al analizar el ticket', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}