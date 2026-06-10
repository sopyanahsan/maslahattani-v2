import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { BrilinkService } from './brilink.service';
import {
  CreateBrilinkTransactionDto,
  CreateBrilinkFeeDto,
  UpdateBrilinkFeeDto,
  QueryBrilinkTransactionsDto,
  QueryChartDto,
} from './dto';
import { JwtAuthGuard } from '../auth/guards';
import { ShopScopeGuard } from '../auth/guards/shop-scope.guard';
import { RequirePermission } from '../permissions/require-permission.guard';

@ApiTags('BRILink')
@Controller('api/brilink')
@UseGuards(JwtAuthGuard, ShopScopeGuard)
@ApiBearerAuth()
export class BrilinkController {
  constructor(private readonly brilinkService: BrilinkService) {}

  // ============================================
  // TRANSACTIONS
  // ============================================

  @Get('transactions')
  @ApiOperation({ summary: 'List transaksi BRILink (paginated, filterable)' })
  async listTransactions(@Query() query: QueryBrilinkTransactionsDto) {
    return this.brilinkService.listTransactions(query);
  }

  @Get('transactions/kpi')
  @ApiOperation({ summary: 'KPI target cards: trx count, volume, fee vs target hari ini' })
  async getKpi(@Query('shopId') shopId: string) {
    return this.brilinkService.getKpi(shopId);
  }

  @Get('transactions/chart')
  @ApiOperation({ summary: 'Chart data: transactions stacked per kategori atau profit line' })
  async getTransactionsChart(@Query() query: QueryChartDto) {
    return this.brilinkService.getTransactionsChart(
      query.shopId,
      query.period || 'today',
      query.type || 'transactions',
      query.startDate,
      query.endDate,
    );
  }

  @Post('transactions')
  @ApiOperation({ summary: 'Buat transaksi BRILink (dual-impact: rekening + kas tunai)' })
  async createTransaction(
    @Body() dto: CreateBrilinkTransactionDto,
    @Request() req: any,
  ) {
    const shopId = req.user.shopId;
    const cashierId = req.user.sub || req.user.id;
    return this.brilinkService.createTransaction(dto, shopId, cashierId);
  }

  @Post('transactions/sync')
  @ApiOperation({ summary: 'Batch sync transaksi offline dari webapp kasir' })
  async syncTransactions(
    @Body() body: { transactions: any[] },
    @Request() req: any,
  ) {
    const shopId = req.user.shopId;
    const cashierId = req.user.sub || req.user.id;
    return this.brilinkService.syncTransactions(
      body.transactions,
      shopId,
      cashierId,
    );
  }

  @Post('transactions/:id/void')
  @RequirePermission('brilink.void')
  @ApiOperation({ summary: 'Void transaksi BRILink (reverse saldo rekening + kas tunai)' })
  async voidTransaction(
    @Param('id') id: string,
    @Body() body: { reason: string },
    @Request() req: any,
  ) {
    const userId = req.user.sub || req.user.id;
    return this.brilinkService.voidTransaction(id, body.reason, userId);
  }

  // ============================================
  // STATS
  // ============================================

  @Get('stats')
  @ApiOperation({ summary: 'Statistik transaksi BRILink (all-time, today, by-category)' })
  async getStats(@Query('shopId') shopId: string) {
    return this.brilinkService.getStats(shopId);
  }

  // ============================================
  // FEES
  // ============================================

  @Get('fees')
  @ApiOperation({ summary: 'List fee rules BRILink per shop' })
  async listFees(@Query('shopId') shopId: string) {
    return this.brilinkService.listFees(shopId);
  }

  @Post('fees')
  @RequirePermission('brilink.fee')
  @ApiOperation({ summary: 'Buat fee rule baru' })
  async createFee(@Body() dto: CreateBrilinkFeeDto) {
    return this.brilinkService.createFee(dto);
  }

  @Patch('fees/:id')
  @RequirePermission('brilink.fee')
  @ApiOperation({ summary: 'Update fee rule' })
  async updateFee(@Param('id') id: string, @Body() dto: UpdateBrilinkFeeDto) {
    return this.brilinkService.updateFee(id, dto);
  }

  @Delete('fees/:id')
  @RequirePermission('brilink.fee')
  @ApiOperation({ summary: 'Hapus fee rule' })
  async deleteFee(@Param('id') id: string) {
    return this.brilinkService.deleteFee(id);
  }
}
