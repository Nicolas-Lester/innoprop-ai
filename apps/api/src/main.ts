import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 1. Habilitamos CORS para que el puerto 3000 pueda hablar con el 4000 sin bloqueos de seguridad del navegador
  app.enableCors();

  // 2. Cambiamos el puerto por defecto al 4000
  await app.listen(process.env.PORT ?? 4000);
}
bootstrap();