import { Controller, Get, Patch, Param, Body, Query, UseGuards, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { UpdateTicketStatusDto } from './dto/update-ticket-status.dto';

@ApiTags('Admin / Dashboard')
@Controller('admin')
@UseGuards(AuthGuard('jwt')) 
@ApiBearerAuth()
export class AdminController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('tickets')
  @ApiOperation({ summary: 'Ver todos los tickets del sistema con filtros' })
  @ApiQuery({ name: 'priority', required: false })
  @ApiQuery({ name: 'status', required: false })
  async getAllTickets(
    @Query('priority') priority?: string,
    @Query('status') status?: string,
  ) {
    return this.prisma.ticket.findMany({
      where: {
        ...(priority && { priority: { equals: priority, mode: 'insensitive' } }),
        ...(status && { status: { equals: status, mode: 'insensitive' } }),
      },
      orderBy: { createdAt: 'desc' },
      include: {
        reporter: {
          select: { email: true, name: true }
        }
      }
    });
  }

  @Patch('tickets/:id/status')
  @ApiOperation({ summary: 'Cambiar el estado de un ticket' })
  async updateStatus(
    @Param('id') id: string,
    @Body() updateDto: UpdateTicketStatusDto
  ) {
    try {
      const updatedTicket = await this.prisma.ticket.update({
        where: { id },
        data: { status: updateDto.status },
      });
      return {
        message: `Ticket actualizado a ${updateDto.status}`,
        data: updatedTicket
      };
    } catch (error) {
      throw new HttpException('Ticket no encontrado', HttpStatus.NOT_FOUND);
    }
  }
}