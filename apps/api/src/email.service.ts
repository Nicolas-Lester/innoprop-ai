import { Injectable } from '@nestjs/common';
import { Resend } from 'resend';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class EmailService {
  private resend: Resend;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('RESEND_API_KEY');
    if (!apiKey) {
      console.warn('RESEND_API_KEY no configurada — el envío de emails está deshabilitado');
    }
    this.resend = new Resend(apiKey ?? 're_placeholder');
  }

  async sendUrgentNotification(category: string, summary: string, priority: string) {
    const { data, error } = await this.resend.emails.send({
      from: 'InnoProp AI <onboarding@resend.dev>',
      to: ['nicolasherreramontes625@gmail.com'], // En free tier solo puedes enviar a tu propio email de Resend
      subject: `🚨 ALERTA: Ticket ${priority} - ${category}`,
      html: `
        <h1>Se ha detectado un problema urgente</h1>
        <p><strong>Categoría:</strong> ${category}</p>
        <p><strong>Resumen IA:</strong> ${summary}</p>
        <hr />
        <p>Este ticket fue procesado automáticamente por el motor de InnoProp AI.</p>
      `,
    });

    if (error) {
      console.error('Error enviando email:', error);
    }
    return data;
  }
}