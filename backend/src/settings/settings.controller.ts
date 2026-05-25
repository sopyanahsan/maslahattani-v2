import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard, Roles } from '../auth/guards/roles.guard';
import { SettingsService } from './settings.service';
import { UpdateLanguageDto, UpdateReceiptConfigDto } from './dto/update-settings.dto';
import { UpdateShopDto, CreateShopDto } from './dto/update-shop.dto';
import { Role } from '@prisma/client';

@ApiTags('Settings / Pengaturan')
@Controller('api/settings')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.SUPER_ADMIN)
@ApiBearerAuth()
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  @ApiOperation({ summary: 'Get pengaturan toko (bahasa, struk, data toko)' })
  async getSettings(@Query('shopId') shopId: string) {
    return this.settingsService.getSettings(shopId);
  }

  @Put('language')
  @ApiOperation({ summary: 'Update bahasa system' })
  async updateLanguage(@Body() dto: UpdateLanguageDto) {
    return this.settingsService.updateLanguage(dto);
  }

  @Put('receipt-config')
  @ApiOperation({ summary: 'Update pengaturan cetak struk' })
  async updateReceiptConfig(@Body() dto: UpdateReceiptConfigDto) {
    return this.settingsService.updateReceiptConfig(dto);
  }

  @Put('shop/:id')
  @ApiOperation({ summary: 'Update data toko (nama, alamat, no hp)' })
  async updateShop(@Param('id') id: string, @Body() dto: UpdateShopDto) {
    return this.settingsService.updateShop(id, dto);
  }

  @Post('shop')
  @ApiOperation({ summary: 'Tambah cabang baru' })
  async createShop(@Body() dto: CreateShopDto, @Request() req: any) {
    return this.settingsService.createShop(dto, req.user.id);
  }

  @Get('shops')
  @ApiOperation({ summary: 'List semua toko/cabang (multi-cabang)' })
  async listShops(@Request() req: any) {
    return this.settingsService.listShops(req.user.id);
  }
}
