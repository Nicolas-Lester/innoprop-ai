import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaService } from './prisma.service'; // Importa el servicio de Prisma

@Module({
  imports: [],
  controllers: [AppController],
  providers: [AppService, PrismaService], // Agrega PrismaService a los proveedores
})
export class AppModule {}
