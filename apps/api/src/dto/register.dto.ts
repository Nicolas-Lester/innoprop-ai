import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';

export class RegisterDto {
  @ApiProperty({ example: 'nicolas@ejemplo.com' })
  @IsEmail({}, { message: 'El email no es válido' })
  email!: string;

  @ApiProperty({ example: '123456' })
  @IsString()
  @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres' })
  password!: string;

  @ApiProperty({ example: 'Nicolás Herrera' })
  @IsString()
  name!: string;
}