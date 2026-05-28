import {
  Controller,
  Get,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard, Roles } from '../auth/guards/roles.guard';
import { ReportsService } from './reports.service';
import { Role } from '@prisma/client';

@ApiTags('Reports / Laporan')
@Controller('api/reports')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.SUPER_ADMIN)
@ApiBearerAuth()
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('sales')
  @ApiOperation({
    summary: 'Laporan penjualan (omzet, profit, method breakdown, top products, daily trend)',
  })
  async getSalesReport(
    @Query('shopId') shopId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.reportsService.getSalesReport(shopId, startDate, endDate);
  }

  @Get('debts')
  @ApiOperation({
    summary: 'Laporan hutang (outstanding, overdue, recent payments)',
  })
  async getDebtReport(@Query('shopId') shopId: string) {
    return this.reportsService.getDebtReport(shopId);
  }

  @Get('brilink')
  @ApiOperation({
    summary: 'Laporan BRILink (volume, fee, category breakdown)',
  })
  async getBrilinkReport(
    @Query('shopId') shopId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.reportsService.getBrilinkReport(shopId, startDate, endDate);
  }
}
