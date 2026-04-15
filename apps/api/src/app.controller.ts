import { Controller, Get, Post, Body} from '@nestjs/common';
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
    const analysis = await this.aiService.analyzeTicket(description);
    return JSON.parse(analysis); // Lo devolvemos como objeto JSON real
  }
}