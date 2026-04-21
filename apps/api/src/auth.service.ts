import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from './prisma.service';
import { RegisterDto } from './dto/register.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async register(data: RegisterDto) {
    const hashedPassword = await bcrypt.hash(data.password, 10);
    const user = await this.prisma.user.create({
      data: {
        ...data,
        password: hashedPassword,
        // Prisma usará el default (TENANT) si no viene en el DTO
      },
    });
    const { password, ...result } = user;
    return result;
  }

  async login(email: string, pass: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    
    if (user && await bcrypt.compare(pass, user.password)) {
      // --- PAYLOAD ACTUALIZADO CON EL ROL ---
      const payload = { 
        sub: user.id, 
        email: user.email, 
        role: user.role // <--- Vital para que el RolesGuard funcione en otras rutas
      };

      return {
        access_token: await this.jwtService.signAsync(payload),
        role: user.role, // <--- LA CORRECCIÓN: Lo enviamos en la raíz para el Frontend
        user: {
          email: user.email,
          name: user.name,
          role: user.role
        }
      };
    }
    throw new UnauthorizedException('Credenciales inválidas');
  }
}