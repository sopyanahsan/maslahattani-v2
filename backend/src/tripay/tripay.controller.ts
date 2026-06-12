import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  Headers,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { TripayService } from './tripay.service';
import {
  UpdateTripayConfigDto,
  TripayInquiryDto,
  CreatePpobTransactionDto,
  QueryPpobTransactionsDto,
} from './dto';
import { JwtAuthGuard } from '../auth/guards';
import { ShopScopeGuard } from '../auth/guards/shop-scope.guard';
import { RequirePermission } from '../permissions/require-permission.guard';

@ApiTags('Tripay PPOB')
@Controller('api/tripay')
export class TripayController {
  constructor(private readonly tripayService: TripayService) {}

  // ============================================
  // CONFIG (Admin only)
  // ============================================

  @Get('config')
  @UseGuards(JwtAuthGuard, ShopScopeGuard)
  @ApiBearerAuth()
  @RequirePermission('settings.manage')
  @ApiOperation({ summary: 'Get Tripay config (masked secrets)' })
  async getConfig(@Query('shopId') shopId: string) {
    return this.tripayService.getConfig(shopId);
  }

  @Patch('config')
  @UseGuards(JwtAuthGuard, ShopScopeGuard)
  @ApiBearerAuth()
  @RequirePermission('settings.manage')
  @ApiOperation({ summary: 'Simpan/update konfigurasi Tripay API' })
  async saveConfig(
    @Body() dto: UpdateTripayConfigDto,
    @Request() req: any,
  ) {
    const shopId = req.user.shopId;
    return this.tripayService.saveConfig(shopId, dto);
  }

  @Post('config/verify')
  @UseGuards(JwtAuthGuard, ShopScopeGuard)
  @ApiBearerAuth()
  @RequirePermission('settings.manage')
  @ApiOperation({ summary: 'Verifikasi koneksi Tripay (test API key)' })
  async verifyConfig(@Request() req: any) {
    const shopId = req.user.shopId;
    return this.tripayService.verifyConfig(shopId);
  }

  // ============================================
  // PRODUCTS
  // ============================================

  @Get('products/categories')
  @UseGuards(JwtAuthGuard, ShopScopeGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Daftar kategori produk PPOB' })
  getProductCategories() {
    return this.tripayService.getProductCategories();
  }

  @Get('products')
  @UseGuards(JwtAuthGuard, ShopScopeGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Daftar produk PPOB dari Tripay (per kategori)' })
  async getProducts(
    @Query('shopId') shopId: string,
    @Query('category') category?: string,
  ) {
    return this.tripayService.getProducts(shopId, category);
  }

  // ============================================
  // INQUIRY
  // ============================================

  @Post('inquiry')
  @UseGuards(JwtAuthGuard, ShopScopeGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Inquiry / cek tagihan (postpaid) atau cek harga (prepaid)' })
  async inquiry(@Body() dto: TripayInquiryDto, @Request() req: any) {
    const shopId = dto.shopId || req.user.shopId;
    return this.tripayService.inquiry(shopId, dto.productCode, dto.customerId);
  }

  // ============================================
  // TRANSACTIONS
  // ============================================

  @Post('transactions')
  @UseGuards(JwtAuthGuard, ShopScopeGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Buat transaksi PPOB (beli pulsa, bayar tagihan, dst.)' })
  async createTransaction(
    @Body() dto: CreatePpobTransactionDto,
    @Request() req: any,
  ) {
    const shopId = req.user.shopId;
    const cashierId = req.user.sub || req.user.id;
    return this.tripayService.createTransaction(shopId, cashierId, dto);
  }

  @Get('transactions')
  @UseGuards(JwtAuthGuard, ShopScopeGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List transaksi PPOB (paginated, filterable)' })
  async listTransactions(@Query() query: QueryPpobTransactionsDto) {
    const shopId = query.shopId!;
    return this.tripayService.listTransactions(shopId, query);
  }

  @Get('transactions/:id/status')
  @UseGuards(JwtAuthGuard, ShopScopeGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cek status transaksi PPOB dari Tripay' })
  async checkTransactionStatus(
    @Param('id') id: string,
    @Query('shopId') shopId: string,
  ) {
    return this.tripayService.checkTransactionStatus(shopId, id);
  }

  // ============================================
  // CALLBACK (Webhook — no auth guard)
  // ============================================

  @Post('callback')
  @ApiOperation({ summary: 'Webhook callback dari Tripay' })
  async handleCallback(
    @Body() body: any,
    @Headers('x-callback-signature') signature: string,
  ) {
    return this.tripayService.handleCallback(body, signature);
  }
}
