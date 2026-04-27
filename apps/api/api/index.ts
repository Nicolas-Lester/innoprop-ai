/**
 * Vercel Serverless Handler para NestJS
 * Vercel detecta automáticamente archivos en el directorio /api
 * y los sirve como funciones serverless con @vercel/node.
 */
import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import type { IncomingMessage, ServerResponse } from 'http';

let cachedServer: any = null;

async function bootstrap() {
  if (cachedServer) return cachedServer;

  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn'],
  });

  app.enableCors({
    origin: process.env.CORS_ORIGIN
      ? process.env.CORS_ORIGIN.split(',')
      : true,
    credentials: true,
  });

  await app.init();
  cachedServer = app.getHttpAdapter().getInstance();
  return cachedServer;
}

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  const server = await bootstrap();
  server(req, res);
}
