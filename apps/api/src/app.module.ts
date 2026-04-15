import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config'; // Importa esto
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaService } from './prisma.service';
import { AIService } from './ai.service';
import { EmailService } from './email.service';
import * as path from 'path';
import { ThrottlerModule } from '@nestjs/throttler';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './jwt.strategy';

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
  controllers: [AppController, AuthController],
  providers: [AppService, PrismaService, AIService, EmailService, AuthService, JwtStrategy],
})
export class AppModule {}
