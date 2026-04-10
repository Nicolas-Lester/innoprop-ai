import { defineConfig } from '@prisma/config';
import * as dotenv from 'dotenv';
import path from 'path';

// Esto busca el .env dos carpetas arriba (en la raíz del monorepo)
dotenv.config({ path: path.join(__dirname, '../../.env') });

export default defineConfig({
  schema: './prisma/schema.prisma',
  datasource: {
    url: process.env.DATABASE_URL,
  },
});