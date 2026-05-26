import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { CashBoxCategoriesService } from './cashbox-categories.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard, Roles } from '../auth/guards/roles.guard';
import { Role } from '@prisma/client';
import {
  CreateCashBoxCategoryDto,
  UpdateCashBoxCategoryDto,
} from './dto';

@ApiTags('CashBox Categories')
@Controller('api/cashbox-categories')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class CashBoxCategoriesController {
  constructor(private readonly service: CashBoxCategoriesService) {}

  @Get()
  @ApiOperation({
    summary: 'List kategori cashbox',
    description:
      'Default-nya hanya kategori aktif. Super-admin bisa pass includeInactive=true untuk lihat yang sudah dinonaktifkan.',
  })
  @ApiQuery({
    name: 'includeInactive',
    required: false,
    type: Boolean,
    description:
      'Include kategori yang sudah dinonaktifkan (super-admin only feature).',
  })
  async list(@Query('includeInactive') includeInactive?: string) {
    return this.service.list(includeInactive === 'true');
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detail kategori cashbox' })
  @ApiParam({ name: 'id', description: 'Category ID' })
  async findOne(@Param('id') id: string) {
    const category = await this.service.findOne(id);
    return { category };
  }

  @Post()
  @Roles(Role.SUPER_ADMIN)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Buat kategori cashbox baru (Super-admin only)',
  })
  async create(@Body() dto: CreateCashBoxCategoryDto) {
    return this.service.create(dto);
  }

  @Put(':id')
  @Roles(Role.SUPER_ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update kategori cashbox (Super-admin only)',
    description:
      'Field code tidak bisa diubah. Untuk soft-disable, set isActive=false.',
  })
  @ApiParam({ name: 'id', description: 'Category ID' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateCashBoxCategoryDto,
  ) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @Roles(Role.SUPER_ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Hapus kategori cashbox (Super-admin only)',
    description:
      'Soft-delete kalau sudah dipakai di shift. Hard-delete kalau belum pernah dipakai. Kategori default tidak bisa dihapus.',
  })
  @ApiParam({ name: 'id', description: 'Category ID' })
  async remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
