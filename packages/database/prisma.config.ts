import { defineConfig } from '@prisma/config';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../../.env') });

export default defineConfig({
  schema: './prisma/schema.prisma',
  datasource: {
    // IMPORTANTE: Para el comando db:push, usa la DIRECT_URL (puerto 5432)
    // Esto evita que el Pooler bloquee la creación de tablas
    url: process.env.DIRECT_URL, 
  },
});