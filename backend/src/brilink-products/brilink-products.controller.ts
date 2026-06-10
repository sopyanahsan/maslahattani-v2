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
import { BrilinkProductsService } from './brilink-products.service';
import {
  CreateBrilinkProductDto,
  UpdateBrilinkProductDto,
  QueryBrilinkProductsDto,
  SeedProductsDto,
} from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('BRILink Products & Operators')
@Controller('api/brilink')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class BrilinkProductsController {
  constructor(private readonly service: BrilinkProductsService) {}

  // ============================================
  // OPERATOR DETECTION
  // ============================================

  @Get('operators/detect')
  @ApiOperation({ summary: 'Auto-detect operator dari nomor HP' })
  async detectOperator(@Query('phone') phone: string) {
    return this.service.detectOperator(phone);
  }

  @Get('operators')
  @ApiOperation({ summary: 'List semua operator prefix' })
  async getAllPrefixes() {
    return this.service.getAllPrefixes();
  }

  // ============================================
  // PRODUCTS CRUD
  // ============================================

  @Get('products')
  @ApiOperation({ summary: 'List produk BRILink per shop (pulsa, data, ewallet, PLN)' })
  async listProducts(@Query() query: QueryBrilinkProductsDto) {
    return this.service.listProducts(query);
  }

  @Post('products')
  @ApiOperation({ summary: 'Tambah produk baru' })
  async createProduct(@Body() dto: CreateBrilinkProductDto) {
    return this.service.createProduct(dto);
  }

  @Patch('products/:id')
  @ApiOperation({ summary: 'Update produk (harga, nama, aktif)' })
  async updateProduct(@Param('id') id: string, @Body() dto: UpdateBrilinkProductDto) {
    return this.service.updateProduct(id, dto);
  }

  @Delete('products/:id')
  @ApiOperation({ summary: 'Hapus produk' })
  async deleteProduct(@Param('id') id: string) {
    return this.service.deleteProduct(id);
  }

  @Post('products/seed')
  @ApiOperation({ summary: 'Seed produk dari template (standard/premium/economy)' })
  async seedProducts(@Body() dto: SeedProductsDto) {
    return this.service.seedProducts(dto);
  }

  // ============================================
  // BANK LIST
  // ============================================

  @Get('banks')
  @ApiOperation({ summary: 'List daftar bank (searchable, filterable)' })
  async listBanks(
    @Query('search') search?: string,
    @Query('isActive') isActive?: string,
  ) {
    const active = isActive === 'true' ? true : isActive === 'false' ? false : undefined;
    return this.service.listBanks(search, active);
  }

  @Patch('banks/:id/toggle')
  @ApiOperation({ summary: 'Toggle aktif/nonaktif bank' })
  async toggleBank(@Param('id') id: string, @Body() body: { isActive: boolean }) {
    return this.service.toggleBank(id, body.isActive);
  }

  // ============================================
  // E-WALLET PROVIDERS
  // ============================================

  @Get('ewallet-providers')
  @ApiOperation({ summary: 'List e-wallet providers' })
  async listEwalletProviders() {
    return this.service.listEwalletProviders();
  }

  @Patch('ewallet-providers/:id/toggle')
  @ApiOperation({ summary: 'Toggle aktif/nonaktif e-wallet provider' })
  async toggleEwalletProvider(@Param('id') id: string, @Body() body: { isActive: boolean }) {
    return this.service.toggleEwalletProvider(id, body.isActive);
  }
}
