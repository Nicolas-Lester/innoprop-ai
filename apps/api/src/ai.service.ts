import { Injectable, OnModuleInit } from '@nestjs/common';
import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AIService implements OnModuleInit {
  private genAI: GoogleGenerativeAI;
  private model!: GenerativeModel;

constructor(private configService: ConfigService) {
  const apiKey = this.configService.get<string>('GEMINI_API_KEY');
  
  // Validamos que la llave exista para que TypeScript esté tranquilo
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY no encontrada en las variables de entorno');
  }

  this.genAI = new GoogleGenerativeAI(apiKey);
}

  onModuleInit() {
    // gemini-2.5-flash: último modelo disponible con cuota gratuita activa
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
  }

  private async generateWithRetry(prompt: string, retries = 3): Promise<string> {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const result = await this.model.generateContent(prompt);
        const response = await result.response;
        return response.text().replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
      } catch (error: any) {
        const isRateLimit = error?.status === 429 || error?.message?.includes('RESOURCE_EXHAUSTED');
        if (isRateLimit && attempt < retries) {
          // Espera 2^attempt segundos (2s, 4s, 8s)
          await new Promise(res => setTimeout(res, 2 ** attempt * 1000));
          continue;
        }
        throw error;
      }
    }
    throw new Error('No se pudo obtener respuesta de la IA tras varios intentos');
  }

  async analyzeTicket(description: string) {
    const prompt = `
      Eres un asistente experto en gestión inmobiliaria para InnoProp AI.
      Tu tarea es analizar reportes de problemas en departamentos y categorizarlos.
      
      Reglas:
      - Responde ÚNICAMENTE en formato JSON puro.
      - Categorías: GASFITERIA, ELECTRICIDAD, ESTRUCTURA, LIMPIEZA, OTROS.
      - Prioridad: BAJA, MEDIA, ALTA, CRITICA.

      Ticket a analizar: "${description}"

      Respuesta esperada (ejemplo):
      {
        "categoria": "GASFITERIA",
        "prioridad": "ALTA",
        "resumen": "Filtración activa en baño principal",
        "pasos_sugeridos": ["Cerrar llave de paso", "Contactar gásfiter urgente"]
      }
    `;

    const raw = await this.generateWithRetry(prompt);
    return raw;
  }
}