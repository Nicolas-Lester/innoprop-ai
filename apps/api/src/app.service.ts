import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Injectable()
export class AppService {
  getHello() {
    return { 
      status: 'online', 
      message: 'InnoProp AI API funcionando correctamente',
      version: '1.0.0'
    };
  }
}