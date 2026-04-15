import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger'; // <-- Importa Swagger

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  app.useGlobalPipes(new ValidationPipe());

  // Configuración de Swagger
  const config = new DocumentBuilder()
    .setTitle('InnoProp AI - Backend API')
    .setDescription('Plataforma inteligente de gestión de propiedades con IA')
    .setVersion('1.0')
    .addTag('Tickets')
    .build();
    
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document); // Esto define la ruta /api

  await app.listen(4000);
}
bootstrap();