import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { DashboardBrilinkService } from './dashboard-brilink.service';
import {
  QueryDashboardBrilinkDto,
  QueryShopOnlyDto,
} from './dto/query-dashboard-brilink.dto';
import { DashboardPeriod } from '../dashboard/dto/query-dashboard.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Dashboard BRILink')
@Controller('api/dashboard/brilink')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class DashboardBrilinkController {
  constructor(private readonly service: DashboardBrilinkService) {}

  @Get('overview')
  @ApiOperation({
    summary: 'KPI cards: transactions, volume, feeEarnings, avgFee + compare',
  })
  async getOverview(@Query() query: QueryDashboardBrilinkDto) {
    return this.service.getOverview(
      query.shopId,
      query.period || DashboardPeriod.TODAY,
    );
  }

  @Get('transactions-chart')
  @ApiOperation({
    summary: 'Stacked chart per 7 kategori BRILink (hourly/daily buckets)',
  })
  async getTransactionsChart(@Query() query: QueryDashboardBrilinkDto) {
    return this.service.getTransactionsChart(
      query.shopId,
      query.period || DashboardPeriod.TODAY,
    );
  }

  @Get('category-breakdown')
  @ApiOperation({
    summary: 'Per kategori: count, volume, fee, percent',
  })
  async getCategoryBreakdown(@Query() query: QueryDashboardBrilinkDto) {
    return this.service.getCategoryBreakdown(
      query.shopId,
      query.period || DashboardPeriod.TODAY,
    );
  }

  @Get('recent-transactions')
  @ApiOperation({ summary: '10 transaksi BRILink terbaru' })
  async getRecentTransactions(@Query() query: QueryDashboardBrilinkDto) {
    return this.service.getRecentTransactions(
      query.shopId,
      query.limit || 10,
    );
  }

  @Get('top-customers')
  @ApiOperation({
    summary: 'Top customers today (fixed period), group by name+phone',
  })
  async getTopCustomers(@Query() query: QueryShopOnlyDto) {
    return this.service.getTopCustomers(query.shopId, query.limit || 5);
  }

  @Get('accounts')
  @ApiOperation({ summary: 'List rekening BRI + isLowBalance flag' })
  async getAccounts(@Query('shopId') shopId: string) {
    return this.service.getAccounts(shopId);
  }

  @Get('alerts')
  @ApiOperation({
    summary: 'Alerts: lowBalance per-account, failedTrx today, categoriesWithoutFee',
  })
  async getAlerts(@Query('shopId') shopId: string) {
    return this.service.getAlerts(shopId);
  }

  @Get('cashier-performance')
  @ApiOperation({
    summary: 'Top 5 kasir BRILink today (fixed period) by trx count + fee',
  })
  async getCashierPerformance(@Query() query: QueryShopOnlyDto) {
    return this.service.getCashierPerformance(query.shopId, query.limit || 5);
  }
}
