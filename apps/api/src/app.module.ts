import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config'; // Importa esto
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaService } from './prisma.service';
import { AIService } from './ai.service';
import { EmailService } from './email.service';
import * as path from 'path';
import { ThrottlerModule } from '@nestjs/throttler';

@Module({
  imports: [
    ConfigModule.forRoot({
      // Esto le dice a Nest que busque el .env dos carpetas arriba (en la raíz)
      envFilePath: path.join(__dirname, '../../../.env'),
      isGlobal: true,
    }),
    ThrottlerModule.forRoot([
      {
        // <--- Agrega el corchete aquí
        ttl: 60000,
        limit: 10,
      },
    ]),
  ],
  controllers: [AppController],
  providers: [AppService, PrismaService, AIService, EmailService],
})
export class AppModule {}
