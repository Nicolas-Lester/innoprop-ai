import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt'; // <-- Este es el que te falta para el error rojo
import { ConfigModule } from '@nestjs/config'; // <-- Para el ConfigModule
import { ThrottlerModule } from '@nestjs/throttler';
import * as path from 'path'; // <-- Importante para que funcione el path.join

// Controllers
import { AppController } from './app.controller';
import { AuthController } from './auth.controller';

// Services
import { AppService } from './app.service';
import { AuthService } from './auth.service';
import { PrismaService } from './prisma.service';
import { AIService } from './ai.service';
import { EmailService } from './email.service';
import { JwtStrategy } from './jwt.strategy';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'SUPER_SECRET_KEY',
      signOptions: { expiresIn: '1d' },
    }),
    ConfigModule.forRoot({
      envFilePath: path.join(__dirname, '../../../.env'),
      isGlobal: true,
    }),
    ThrottlerModule.forRoot([{
      ttl: 60000,
      limit: 10,
    }]),
  ],
  controllers: [AppController, AuthController],
  providers: [
    AppService,
    PrismaService,
    AIService,
    EmailService,
    AuthService,
    JwtStrategy,
  ],
})
export class AppModule {}