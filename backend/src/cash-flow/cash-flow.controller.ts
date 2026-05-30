import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards, Request, ForbiddenException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard, Roles } from '../auth/guards/roles.guard';
import { CashFlowService } from './cash-flow.service';
import { Role } from '@prisma/client';

@ApiTags('Cash Flow')
@Controller('api/cash-flows')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CashFlowController {
  constructor(private readonly service: CashFlowService) {}

  // === Categories ===

  @Get('categories')
  @ApiOperation({ summary: 'List kategori cash in/out' })
  async listCategories(@Request() req: any, @Query('type') type?: string) {
    if (!req.user.shopId) throw new ForbiddenException('Tidak ada cabang aktif.');
    return this.service.listCategories(req.user.shopId, type);
  }

  @Post('categories')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Buat kategori cash in/out (admin)' })
  async createCategory(@Request() req: any, @Body() dto: { name: string; type: string; icon?: string }) {
    if (!req.user.shopId) throw new ForbiddenException('Tidak ada cabang aktif.');
    return this.service.createCategory(req.user.shopId, dto);
  }

  @Patch('categories/:id')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Update kategori (admin)' })
  async updateCategory(@Param('id') id: string, @Request() req: any, @Body() dto: any) {
    return this.service.updateCategory(id, req.user.shopId, dto);
  }

  @Delete('categories/:id')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Hapus kategori (admin)' })
  async deleteCategory(@Param('id') id: string, @Request() req: any) {
    return this.service.deleteCategory(id, req.user.shopId);
  }

  // === Cash Flow Entries ===

  @Post()
  @ApiOperation({ summary: 'Catat cash in/out (kasir)' })
  async create(@Request() req: any, @Body() dto: { categoryId: string; type: string; amount: number; notes?: string; shiftId?: string }) {
    if (!req.user.shopId) throw new ForbiddenException('Tidak ada cabang aktif.');
    return this.service.create(req.user.shopId, req.user.id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List cash flow entries (with filters)' })
  async list(@Request() req: any, @Query() query: any) {
    if (!req.user.shopId) throw new ForbiddenException('Tidak ada cabang aktif.');
    return this.service.list(req.user.shopId, query);
  }

  @Get('summary')
  @ApiOperation({ summary: 'Summary cash in/out (for dashboard/shift)' })
  async getSummary(@Request() req: any, @Query('shiftId') shiftId?: string, @Query('startDate') startDate?: string, @Query('endDate') endDate?: string) {
    if (!req.user.shopId) throw new ForbiddenException('Tidak ada cabang aktif.');
    return this.service.getSummary(req.user.shopId, shiftId, startDate, endDate);
  }

  // === Admin Verify/Reject ===

  @Patch(':id/verify')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Verifikasi pengeluaran (admin)' })
  async verify(@Param('id') id: string, @Request() req: any) {
    return this.service.verify(id, req.user.shopId, req.user.id);
  }

  @Patch(':id/reject')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Tolak pengeluaran (admin)' })
  async reject(@Param('id') id: string, @Request() req: any, @Body() dto: { reason: string }) {
    return this.service.reject(id, req.user.shopId, req.user.id, dto.reason);
  }
}
