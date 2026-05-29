import { Controller, Get, Post, Put, Delete, Param, Body, UseGuards, Request, ForbiddenException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard, Roles } from '../auth/guards/roles.guard';
import { ProductCategoriesService } from './product-categories.service';
import { Role } from '@prisma/client';

@ApiTags('Product Categories')
@Controller('api/product-categories')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ProductCategoriesController {
  constructor(private readonly service: ProductCategoriesService) {}

  @Get()
  @ApiOperation({ summary: 'List semua kategori produk untuk shop aktif' })
  async findAll(@Request() req: any) {
    if (!req.user.shopId) throw new ForbiddenException('Tidak ada cabang aktif.');
    return this.service.findAll(req.user.shopId);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Buat kategori produk baru' })
  async create(@Request() req: any, @Body() dto: { name: string; icon?: string; color?: string; sortOrder?: number }) {
    if (!req.user.shopId) throw new ForbiddenException('Tidak ada cabang aktif.');
    return this.service.create(req.user.shopId, dto);
  }

  @Put(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Update kategori produk' })
  async update(@Param('id') id: string, @Request() req: any, @Body() dto: { name?: string; icon?: string; color?: string; sortOrder?: number; isActive?: boolean }) {
    if (!req.user.shopId) throw new ForbiddenException('Tidak ada cabang aktif.');
    return this.service.update(id, req.user.shopId, dto);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Hapus kategori produk (produk akan unlinked)' })
  async remove(@Param('id') id: string, @Request() req: any) {
    if (!req.user.shopId) throw new ForbiddenException('Tidak ada cabang aktif.');
    return this.service.remove(id, req.user.shopId);
  }
}
