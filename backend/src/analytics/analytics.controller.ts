import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { QueryAnalyticsDto, AnalyticsPeriod } from './dto/query-analytics.dto';
import { JwtAuthGuard } from '../auth/guards';

@Controller('analytics')
@UseGuards(JwtAuthGuard)
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('overview')
  async getOverview(@Query() query: QueryAnalyticsDto) {
    return this.analyticsService.getOverview(
      query.shopId,
      query.period || AnalyticsPeriod.MONTH,
    );
  }

  @Get('revenue-chart')
  async getRevenueChart(@Query() query: QueryAnalyticsDto) {
    return this.analyticsService.getRevenueChart(
      query.shopId,
      query.period || AnalyticsPeriod.MONTH,
    );
  }

  @Get('top-products')
  async getTopProducts(@Query() query: QueryAnalyticsDto) {
    return this.analyticsService.getTopProducts(
      query.shopId,
      query.period || AnalyticsPeriod.MONTH,
      query.limit || 10,
    );
  }

  @Get('payment-breakdown')
  async getPaymentBreakdown(@Query() query: QueryAnalyticsDto) {
    return this.analyticsService.getPaymentBreakdown(
      query.shopId,
      query.period || AnalyticsPeriod.MONTH,
    );
  }

  @Get('hourly-distribution')
  async getHourlyDistribution(@Query() query: QueryAnalyticsDto) {
    return this.analyticsService.getHourlyDistribution(
      query.shopId,
      query.period || AnalyticsPeriod.WEEK,
    );
  }

  @Get('comparison')
  async getComparison(@Query('shopId') shopId: string) {
    return this.analyticsService.getComparison(shopId);
  }
}
