import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import * as path from 'path';

// --- CONTROLADORES ---
import { AppController } from './app.controller';
import { AuthController } from './auth.controller';
import { AdminController } from './admin.controller';

// --- SERVICIOS ---
import { AppService } from './app.service';
import { AuthService } from './auth.service';
import { PrismaService } from './prisma.service';
import { AIService } from './ai.service';
import { EmailService } from './email.service';
import { StorageService } from './storage.service';
import { JwtStrategy } from './jwt.strategy';

@Module({
  imports: [
    // Configuración de JWT para Autenticación
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'SUPER_SECRET_KEY',
      signOptions: { expiresIn: '1d' },
    }),

    // Configuración Global de Variables de Entorno
    ConfigModule.forRoot({
      envFilePath: path.join(__dirname, '../.env'),
      isGlobal: true,
    }),

    // Seguridad: Limitador de peticiones (Rate Limiting)
    ThrottlerModule.forRoot([{
      ttl: 60000, // 1 minuto
      limit: 15,    // Máximo 15 peticiones por minuto
    }]),
  ],
  controllers: [
    AppController, 
    AuthController, 
    AdminController // Dashboard del Administrador
  ],
  providers: [
    AppService,
    PrismaService,
    AIService,
    EmailService,
    StorageService, // Subida a Supabase
    AuthService,
    JwtStrategy,    // Estrategia de validación de tokens
  ],
})
export class AppModule {}