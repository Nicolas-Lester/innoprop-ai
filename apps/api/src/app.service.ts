import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Injectable()
export class AppService {
  constructor(private prisma: PrismaService) {}

  async getHello() {
    const user = await this.prisma.user.upsert({
      where: { email: 'nico@innoprop.ai' },
      update: {},
      create: {
        email: 'nico@innoprop.ai',
        name: 'Nicolás Herrera',
        role: 'ADMIN',
      },
    });
    return { message: `Usuario ${user.name} verificado en la DB`, user };
  }
}