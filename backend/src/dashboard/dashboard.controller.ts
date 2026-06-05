import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import {
  DashboardPeriod,
  QueryDashboardDto,
} from './dto/query-dashboard.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ShopScopeGuard } from '../auth/guards/shop-scope.guard';

/**
 * Dashboard Retail — endpoint utama monitoring operasional toko.
 *
 * Semua endpoint protected JWT, scoped per `shopId` query param.
 * (Super-admin + admin cabang sudah pass JWT validation; row-level filter
 * pakai shopId dari query, bukan dari token, supaya super-admin bisa cross-cabang.
 * Konsisten sama AnalyticsController existing.)
 */
@ApiTags('Dashboard Retail')
@Controller('api/dashboard/retail')
@UseGuards(JwtAuthGuard, ShopScopeGuard)
@ApiBearerAuth()
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('overview')
  @ApiOperation({ summary: 'KPI cards: omzet, transaksi, profit, AOV + compare prev period' })
  async getOverview(@Query() query: QueryDashboardDto) {
    return this.dashboardService.getOverview(
      query.shopId,
      query.period || DashboardPeriod.TODAY,
    );
  }

  @Get('sales-chart')
  @ApiOperation({ summary: 'Chart penjualan: 24 bucket (today) atau 7/30 bucket (week/month)' })
  async getSalesChart(@Query() query: QueryDashboardDto) {
    return this.dashboardService.getSalesChart(
      query.shopId,
      query.period || DashboardPeriod.TODAY,
    );
  }

  @Get('operations')
  @ApiOperation({ summary: 'Status operasional: shift aktif, last online cashier, last transaction' })
  async getOperations(@Query('shopId') shopId: string) {
    return this.dashboardService.getOperations(shopId);
  }

  @Get('top-products')
  @ApiOperation({ summary: 'Top selling products by revenue' })
  async getTopProducts(@Query() query: QueryDashboardDto) {
    return this.dashboardService.getTopProducts(
      query.shopId,
      query.period || DashboardPeriod.TODAY,
      query.limit || 5,
    );
  }

  @Get('recent-activity')
  @ApiOperation({ summary: 'Merged events feed (retail, brilink, stock, opname, transfer)' })
  async getRecentActivity(@Query() query: QueryDashboardDto) {
    return this.dashboardService.getRecentActivity(
      query.shopId,
      query.limit || 10,
    );
  }

  @Get('payment-breakdown')
  @ApiOperation({ summary: 'Breakdown payment method dengan amount, count, percent' })
  async getPaymentBreakdown(@Query() query: QueryDashboardDto) {
    return this.dashboardService.getPaymentBreakdown(
      query.shopId,
      query.period || DashboardPeriod.TODAY,
    );
  }

  @Get('alerts')
  @ApiOperation({ summary: 'Active alerts: hutang jatuh tempo, stok menipis, shift terlalu lama' })
  async getAlerts(@Query('shopId') shopId: string) {
    return this.dashboardService.getAlerts(shopId);
  }

  @Get('alerts/all')
  @ApiOperation({ summary: 'All alerts cross-cabang (untuk bell notif topbar — super admin)' })
  async getAlertsAll() {
    return this.dashboardService.getAlertsMultiShop();
  }

  @Get('cashier-leaderboard')
  @ApiOperation({ summary: 'Top cashier by transaction count + revenue' })
  async getCashierLeaderboard(@Query() query: QueryDashboardDto) {
    return this.dashboardService.getCashierLeaderboard(
      query.shopId,
      query.period || DashboardPeriod.TODAY,
      query.limit || 5,
    );
  }
}
