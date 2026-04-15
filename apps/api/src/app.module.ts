import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config'; // Importa esto
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaService } from './prisma.service';
import { AIService } from './ai.service';
import { EmailService } from './email.service';
import * as path from 'path';

@Module({
  imports: [
    ConfigModule.forRoot({
      // Esto le dice a Nest que busque el .env dos carpetas arriba (en la raíz)
      envFilePath: path.join(__dirname, '../../../.env'),
      isGlobal: true,
    }),
  ],
  controllers: [AppController],
  providers: [AppService, PrismaService, AIService, EmailService],
})
export class AppModule {}