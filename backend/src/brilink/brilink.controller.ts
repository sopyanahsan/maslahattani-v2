import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard, Roles } from '../auth/guards/roles.guard';
import { Role, BrilinkTransactionCategory } from '@prisma/client';
import { BrilinkService } from './brilink.service';
import {
  QueryBrilinkTransactionDto,
  QueryBrilinkDashboardDto,
  CreateBrilinkTransactionDto,
  CreateBrilinkAccountDto,
  UpdateBrilinkAccountDto,
  CreateBrilinkFeeDto,
  UpdateBrilinkFeeDto,
} from './dto';

@ApiTags('BRILink')
@Controller('api/brilink')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.SUPER_ADMIN)
@ApiBearerAuth()
export class BrilinkController {
  constructor(private readonly brilinkService: BrilinkService) {}

  // ============================================================
  // DASHBOARD
  // ============================================================

  @Get('dashboard')
  @ApiOperation({ summary: 'Dashboard summary: KPI, category breakdown, daily trend, recent transactions' })
  async getDashboard(@Query() dto: QueryBrilinkDashboardDto) {
    return this.brilinkService.getDashboardSummary(dto.shopId, dto.period);
  }

  // ============================================================
  // TRANSACTIONS
  // ============================================================

  @Get('transactions')
  @ApiOperation({ summary: 'List transaksi BRILink dengan filter & pagination' })
  async listTransactions(@Query() dto: QueryBrilinkTransactionDto) {
    return this.brilinkService.listTransactions(dto);
  }

  @Post('transactions')
  @ApiOperation({ summary: 'Buat transaksi BRILink baru (auto-hitung fee)' })
  async createTransaction(@Body() dto: CreateBrilinkTransactionDto) {
    return this.brilinkService.createTransaction(dto);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Statistik BRILink: total volume, fee, count, breakdown per kategori' })
  async getStats(@Query('shopId') shopId: string) {
    return this.brilinkService.getStats(shopId);
  }

  @Get('fee/calculate')
  @ApiOperation({ summary: 'Hitung fee untuk kategori & nominal tertentu' })
  async calculateFee(
    @Query('shopId') shopId: string,
    @Query('category') category: BrilinkTransactionCategory,
    @Query('amount') amount: string,
  ) {
    return this.brilinkService.calculateFee(shopId, category, parseInt(amount, 10));
  }

  // ============================================================
  // ACCOUNTS
  // ============================================================

  @Get('accounts')
  @ApiOperation({ summary: 'List rekening BRILink milik toko' })
  async listAccounts(@Query('shopId') shopId: string) {
    return this.brilinkService.listAccounts(shopId);
  }

  @Post('accounts')
  @ApiOperation({ summary: 'Tambah rekening BRILink baru' })
  async createAccount(@Body() dto: CreateBrilinkAccountDto) {
    return this.brilinkService.createAccount(dto);
  }

  @Put('accounts/:id')
  @ApiOperation({ summary: 'Update rekening BRILink' })
  async updateAccount(@Param('id') id: string, @Body() dto: UpdateBrilinkAccountDto) {
    return this.brilinkService.updateAccount(id, dto);
  }

  @Delete('accounts/:id')
  @ApiOperation({ summary: 'Hapus rekening BRILink (tidak bisa hapus rekening utama)' })
  async deleteAccount(@Param('id') id: string) {
    return this.brilinkService.deleteAccount(id);
  }

  @Get('accounts/:id/mutations')
  @ApiOperation({ summary: 'Riwayat mutasi saldo rekening BRILink' })
  async listMutations(
    @Param('id') id: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.brilinkService.listMutations(
      id,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
    );
  }

  // ============================================================
  // FEES
  // ============================================================

  @Get('fees')
  @ApiOperation({ summary: 'List pengaturan fee BRILink per toko' })
  async listFees(@Query('shopId') shopId: string) {
    return this.brilinkService.listFees(shopId);
  }

  @Post('fees')
  @ApiOperation({ summary: 'Tambah aturan fee BRILink baru' })
  async createFee(@Body() dto: CreateBrilinkFeeDto) {
    return this.brilinkService.createFee(dto);
  }

  @Put('fees/:id')
  @ApiOperation({ summary: 'Update aturan fee BRILink' })
  async updateFee(@Param('id') id: string, @Body() dto: UpdateBrilinkFeeDto) {
    return this.brilinkService.updateFee(id, dto);
  }

  @Delete('fees/:id')
  @ApiOperation({ summary: 'Hapus aturan fee BRILink' })
  async deleteFee(@Param('id') id: string) {
    return this.brilinkService.deleteFee(id);
  }
}
