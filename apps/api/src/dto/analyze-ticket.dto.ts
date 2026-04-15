import { IsString, MinLength, MaxLength } from 'class-validator';

export class AnalyzeTicketDto {
  @IsString({ message: 'La descripción debe ser un texto' })
  @MinLength(10, { message: 'La descripción es muy corta para ser analizada' })
  @MaxLength(1000, { message: 'La descripción es demasiado larga' })
  description!: string;
}