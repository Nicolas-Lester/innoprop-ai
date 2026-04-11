import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@innoprop/database';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  constructor() {
    // Aquí le pasamos la URL directamente desde las variables de entorno
    super({
      datasources: {
        db: {
          url: process.env.DATABASE_URL,
        },
      },
    });
  }

  async onModuleInit() {
    try {
      await this.$connect();
      console.log('✅ Conexión exitosa a Supabase desde NestJS');
    } catch (error) {
      console.error('❌ Error al conectar con la base de datos:', error);
    }
  }
}