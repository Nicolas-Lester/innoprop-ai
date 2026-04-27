import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import type { IncomingMessage, ServerResponse } from 'http';

let cachedServer: any = null;

async function bootstrap() {
  if (cachedServer) return cachedServer;
  const app = await NestFactory.create(AppModule, { logger: ['error', 'warn'] });

  // Habilitar CORS correctamente desde NestJS
  app.enableCors({
    origin: true, // Permite cualquier origin (puedes restringir a tu dominio después)
    credentials: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: 'Content-Type, Authorization, Accept',
  });

  await app.init();
  cachedServer = app.getHttpAdapter().getInstance();
  return cachedServer;
}

export default async function handler(req: IncomingMessage & { method?: string }, res: ServerResponse) {
  // Headers CORS manuales como capa de seguridad adicional
  const origin = (req.headers as any)['origin'] || '*';
  (res as any).setHeader('Access-Control-Allow-Origin', origin);
  (res as any).setHeader('Access-Control-Allow-Credentials', 'true');
  (res as any).setHeader('Access-Control-Allow-Methods', 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS');
  (res as any).setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept');

  // Responder inmediatamente a preflight requests (OPTIONS)
  if (req.method === 'OPTIONS') {
    (res as any).statusCode = 204;
    res.end();
    return;
  }

  const server = await bootstrap();
  server(req, res);
}
