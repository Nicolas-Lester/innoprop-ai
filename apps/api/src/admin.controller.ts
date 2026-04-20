import { 
  Controller, 
  Get, 
  Patch, 
  Param, 
  Body, 
  Query, 
  UseGuards, 
  HttpException, 
  HttpStatus 
} from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { UpdateTicketStatusDto } from './dto/update-ticket-status.dto';

// --- IMPORTACIONES DE SEGURIDAD QUE FALTABAN ---
import { Roles } from './common/decorators/roles.decorator';
import { RolesGuard } from './common/guards/roles.guard';
import { ApiResponse } from '@nestjs/swagger';

@ApiTags('Admin / Dashboard')
@Controller('admin')
// 1. Aquí agregamos RolesGuard junto al AuthGuard
@UseGuards(AuthGuard('jwt'), RolesGuard) 
// 2. Aquí definimos que TODA la clase es exclusiva para ADMIN
@Roles('ADMIN') 
@ApiBearerAuth()
export class AdminController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('tickets')
  @ApiOperation({ summary: 'Ver todos los tickets del sistema con filtros (Solo ADMIN)' })
  @ApiQuery({ name: 'priority', required: false, example: 'ALTA' })
  @ApiQuery({ name: 'status', required: false, example: 'OPEN' })
  async getAllTickets(
    @Query('priority') priority?: string,
    @Query('status') status?: string,
  ) {
    try {
      return await this.prisma.ticket.findMany({
        where: {
          ...(priority && { 
            priority: { equals: priority, mode: 'insensitive' } 
          }),
          ...(status && { 
            status: { equals: status, mode: 'insensitive' } 
          }),
        },
        orderBy: { createdAt: 'desc' },
        include: {
          reporter: {
            select: { email: true, name: true }
          }
        }
      });
    } catch (error) {
      throw new HttpException('Error al filtrar los tickets', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Patch('tickets/:id/status')
  @ApiOperation({ summary: 'Cambiar el estado de un ticket (Solo ADMIN)' })
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
      // Si el ID no existe en Prisma, lanzará un error que capturamos aquí
      throw new HttpException('Ticket no encontrado o ID inválido', HttpStatus.NOT_FOUND);
    }
  }

  // En AdminController

  @Get('stats')
  @ApiOperation({ summary: 'Obtiene estadísticas globales para el Dashboard (Solo ADMIN)' })
  @ApiResponse({ status: 200, description: 'Estadísticas calculadas con éxito.' })
  async getStats() {
    try {
      // Ejecutamos múltiples consultas en paralelo para mejorar el rendimiento
      const [totalTickets, byStatus, byPriority, byCategory] = await Promise.all([
        // 1. Total de tickets en el sistema
        this.prisma.ticket.count(),

        // 2. Agrupación por Estado (Abiertos, En Progreso, etc.)
        this.prisma.ticket.groupBy({
          by: ['status'],
          _count: true,
        }),

        // 3. Agrupación por Prioridad (Alta, Media, Baja)
        this.prisma.ticket.groupBy({
          by: ['priority'],
          _count: true,
        }),

        // 4. Agrupación por Categoría (IA detectada: Gasfitería, Electricidad, etc.)
        this.prisma.ticket.groupBy({
          by: ['category'],
          _count: true,
        }),
      ]);

      return {
        success: true,
        data: {
          total: totalTickets,
          statusDistribution: byStatus.map(item => ({
            label: item.status,
            value: item._count,
          })),
          priorityDistribution: byPriority.map(item => ({
            label: item.priority,
            value: item._count,
          })),
          categoryDistribution: byCategory.map(item => ({
            label: item.category,
            value: item._count,
          })),
        },
      };
    } catch (error) {
      throw new HttpException(
        'Error al calcular estadísticas',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

}