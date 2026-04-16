import { ApiProperty } from '@nestjs/swagger';

export class AnalyzeWithImageDto {
  @ApiProperty({ 
    example: 'Tengo una filtración...', 
    description: 'Descripción del problema' 
  })
  description: string;

  @ApiProperty({ 
    type: 'string', 
    format: 'binary', 
    description: 'Imagen de la avería (JPG, PNG, WEBP)' // <--- Actualizamos el texto aquí
  })
  image: any;
}