import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';

export enum TicketStatus {
  OPEN = 'OPEN',
  IN_PROGRESS = 'IN_PROGRESS',
  RESOLVED = 'RESOLVED',
  CANCELLED = 'CANCELLED'
}

export class UpdateTicketStatusDto {
  @ApiProperty({ enum: TicketStatus, example: 'IN_PROGRESS' })
  @IsEnum(TicketStatus, { message: 'Estado no válido' })
  status!: TicketStatus;
}