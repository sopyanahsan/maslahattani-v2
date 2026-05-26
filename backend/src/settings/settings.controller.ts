import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
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
import { DashboardService } from '../dashboard/dashboard.service';
import { UpdateLanguageDto, UpdateReceiptConfigDto } from './dto/update-settings.dto';
import { UpdateShopDto, CreateShopDto } from './dto/update-shop.dto';
import { UpdateAlertConfigDto } from './dto/update-alert-config.dto';
import { Role } from '@prisma/client';

@ApiTags('Settings / Pengaturan')
@Controller('api/settings')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.SUPER_ADMIN)
@ApiBearerAuth()
export class SettingsController {
  constructor(
    private readonly settingsService: SettingsService,
    private readonly dashboardService: DashboardService,
  ) {}

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

  // ============================================
  // ALERT CONFIG (Notifikasi & Alert)
  // ============================================

  @Get('alerts')
  @ApiOperation({
    summary: 'Get threshold alert config (lowStock, shift, hutang).',
    description:
      'Return current `alertConfig` dari ShopSetting. Kalau belum di-set, ' +
      'return default values.',
  })
  async getAlertConfig(@Query('shopId') shopId: string) {
    return this.dashboardService.getAlertConfig(shopId);
  }

  @Patch('alerts')
  @ApiOperation({
    summary: 'Update threshold alert config (partial update).',
    description:
      'Field yang tidak di-set dipertahankan dari config existing/default.',
  })
  async updateAlertConfig(
    @Query('shopId') shopId: string,
    @Body() dto: UpdateAlertConfigDto,
  ) {
    return this.dashboardService.updateAlertConfig(shopId, dto);
  }
}
