import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard, Roles } from '../auth/guards/roles.guard';
import { PaymentsService } from './payments.service';
import { CashMutationDto, AuditCashDto } from './dto/cash-mutation.dto';
import { QueryCashMutationDto } from './dto/query-payment.dto';
import { Role } from '@prisma/client';

@ApiTags('Payments & Cash')
@Controller('api/payments')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Get('cash-box')
  @ApiOperation({ summary: 'Get saldo kas toko' })
  async getCashBox(@Query('shopId') shopId: string) {
    return this.paymentsService.getCashBox(shopId);
  }

  @Post('mutation')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Catat mutasi kas (cash in / cash out) - admin only' })
  async createMutation(@Body() dto: CashMutationDto) {
    return this.paymentsService.createMutation(dto);
  }

  @Post('audit')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Audit saldo kas (verifikasi fisik vs sistem) - admin only' })
  async auditCash(@Body() dto: AuditCashDto) {
    return this.paymentsService.auditCash(dto);
  }

  @Get('history')
  @ApiOperation({ summary: 'Riwayat pembayaran transaksi (filter: method, date)' })
  async getPaymentHistory(@Query() query: QueryCashMutationDto) {
    return this.paymentsService.getPaymentHistory(query);
  }

  @Get('cash-mutations')
  @ApiOperation({ summary: 'Riwayat mutasi kas (cash in/out) — filter by categoryId, date' })
  async getCashMutations(@Query() query: QueryCashMutationDto) {
    return this.paymentsService.getCashMutationHistory(query);
  }

  @Get('summary')
  @ApiOperation({ summary: 'Total kas retail (breakdown: cash, QRIS, transfer, hutang)' })
  async getKasSummary(
    @Query('shopId') shopId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.paymentsService.getKasSummary(shopId, startDate, endDate);
  }
}
