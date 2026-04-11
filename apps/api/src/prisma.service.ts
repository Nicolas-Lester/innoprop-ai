import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@innoprop/database';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  constructor() {
    // 1. Creamos el Pool de conexiones nativo de Postgres
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    
    // 2. Envolvemos el pool en el adaptador de Prisma 7
    const adapter = new PrismaPg(pool);

    // 3. Le pasamos el adaptador al constructor
    super({ adapter });
  }

  async onModuleInit() {
    if (!process.env.DATABASE_URL) {
      console.error('⚠️ Advertencia: DATABASE_URL no está definida.');
    }

    try {
      await this.$connect();
      console.log('✅ Conexión exitosa a Supabase desde NestJS (con Prisma 7 Adapter)');
    } catch (error) {
      console.error('❌ Error al conectar con la base de datos:', error);
    }
  }
}