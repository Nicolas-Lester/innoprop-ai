import { ApiProperty } from '@nestjs/swagger'; // <-- Importa ApiProperty
import { IsString, MinLength, MaxLength } from 'class-validator';

export class AnalyzeTicketDto {
  @ApiProperty({
    description: 'Descripción detallada del problema reportado por el arrendatario',
    example: 'Tengo una filtración de agua en el baño principal',
  })
  @IsString()
  @MinLength(10)
  @MaxLength(1000)
  description!: string;
}