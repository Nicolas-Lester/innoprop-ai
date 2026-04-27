import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import type { IncomingMessage, ServerResponse } from 'http';

let cachedServer: any = null;

async function bootstrap() {
  if (cachedServer) return cachedServer;
  const app = await NestFactory.create(AppModule, { logger: ['error', 'warn'] });
  await app.init();
  cachedServer = app.getHttpAdapter().getInstance();
  return cachedServer;
}

export default async function handler(req: IncomingMessage & { method?: string }, res: ServerResponse) {
  const origin = (req.headers as any)['origin'] || '*';

  (res as any).setHeader('Access-Control-Allow-Origin', origin);
  (res as any).setHeader('Access-Control-Allow-Credentials', 'true');
  (res as any).setHeader('Access-Control-Allow-Methods', 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS');
  (res as any).setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept');

  if (req.method === 'OPTIONS') {
    (res as any).writeHead(204);
    res.end();
    return;
  }

  const server = await bootstrap();
  server(req, res);
}
