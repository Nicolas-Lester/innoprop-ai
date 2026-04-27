/**
 * Vercel Serverless Entry Point para NestJS
 * Este archivo reemplaza a main.ts en el entorno serverless de Vercel.
 * NestJS se inicializa una vez y se reutiliza entre invocaciones (warm).
 */
import * as path from 'path';
import * as dotenv from 'dotenv';
dotenv.config({ path: path.join(__dirname, '../.env') });

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { IncomingMessage, ServerResponse } from 'http';

// Cacheamos la app entre invocaciones warm de la función serverless
let expressApp: any = null;

async function bootstrap() {
  if (expressApp) return expressApp;

  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn'],
  });

  app.enableCors({
    origin: process.env.CORS_ORIGIN
      ? process.env.CORS_ORIGIN.split(',')
      : true,
    credentials: true,
  });

  // init() sin listen() — Vercel maneja el binding del puerto
  await app.init();

  expressApp = app.getHttpAdapter().getInstance();
  return expressApp;
}

export default async function handler(
  req: IncomingMessage,
  res: ServerResponse,
) {
  const app = await bootstrap();
  app(req, res);
}
