import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Request,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard, Roles } from '../auth/guards/roles.guard';
import { ShopsService } from './shops.service';
import { CreateShopDto, UpdateShopDto } from './dto';

@ApiTags('Shops')
@Controller('api/shops')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ShopsController {
  constructor(private readonly shopsService: ShopsService) {}

  @Get()
  @ApiOperation({ summary: 'List cabang yang bisa diakses user saat ini' })
  async list(@Request() req: any) {
    return this.shopsService.listAccessible(req.user);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles(Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Buat cabang baru (super-admin only)' })
  async create(@Body() dto: CreateShopDto, @Request() req: any) {
    return this.shopsService.create(dto, req.user);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detail cabang by id' })
  async findOne(@Param('id') id: string, @Request() req: any) {
    return this.shopsService.findOne(id, req.user);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update cabang (super-admin: semua, admin: cabang sendiri)' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateShopDto,
    @Request() req: any,
  ) {
    return this.shopsService.update(id, dto, req.user);
  }

  @Post('select/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Pilih cabang aktif. Re-issue JWT dengan shopId baru. Dipakai setelah login (super-admin) atau saat ganti context.',
  })
  async selectShop(@Param('id') id: string, @Request() req: any) {
    return this.shopsService.selectShop(id, req.user);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Hapus cabang (super-admin only). Cabang dengan data akan di-nonaktifkan.' })
  async remove(@Param('id') id: string, @Request() req: any) {
    return this.shopsService.remove(id, req.user);
  }

  @Get('multi/overview')
  @UseGuards(RolesGuard)
  @Roles(Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Dashboard multi-cabang: overview semua cabang sekaligus (super-admin only)' })
  async getMultiBranchOverview() {
    return this.shopsService.getMultiBranchOverview();
  }

  // === Shop Settings ===

  @Get(':id/settings')
  @ApiOperation({ summary: 'Get semua settings toko (termasuk toggles)' })
  async getSettings(@Param('id') id: string) {
    return this.shopsService.getSettings(id);
  }

  @Patch(':id/settings')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Update settings toko (admin)' })
  async updateSettings(@Param('id') id: string, @Body() dto: any) {
    return this.shopsService.updateSettings(id, dto);
  }
}
