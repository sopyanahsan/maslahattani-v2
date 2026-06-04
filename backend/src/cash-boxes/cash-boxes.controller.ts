import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CashBoxesService } from './cash-boxes.service';
import { CreateCashBoxDto, UpdateCashBoxDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard, Roles } from '../auth/guards/roles.guard';
import { Role } from '@prisma/client';

@ApiTags('Cash Boxes')
@Controller('api/cash-boxes')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CashBoxesController {
  constructor(private readonly service: CashBoxesService) {}

  @Get()
  @ApiOperation({ summary: 'List semua kas retail untuk shop' })
  async findAll(@Query('shopId') shopId: string) {
    return this.service.findAll(shopId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detail satu kas' })
  async findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Buat kas baru (dengan saldo awal)' })
  async create(@Body() dto: CreateCashBoxDto) {
    return this.service.create(dto);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Edit kas (nama / saldo manual)' })
  async update(@Param('id') id: string, @Body() dto: UpdateCashBoxDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Hapus kas (harus saldo 0)' })
  async remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
