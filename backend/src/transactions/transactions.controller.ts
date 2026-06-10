import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  ForbiddenException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard, Roles } from '../auth/guards/roles.guard';
import { ShopScopeGuard } from '../auth/guards/shop-scope.guard';
import { RequirePermission } from '../permissions/require-permission.guard';
import { TransactionsService } from './transactions.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { VoidTransactionDto } from './dto/void-transaction.dto';
import { QueryTransactionDto } from './dto/query-transaction.dto';
import { Role } from '@prisma/client';

@ApiTags('Transactions')
@Controller('api/transactions')
@UseGuards(JwtAuthGuard, ShopScopeGuard)
@ApiBearerAuth()
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Buat transaksi baru (POS - kasir)' })
  async create(@Body() dto: CreateTransactionDto, @Request() req: any) {
    if (!req.user.shopId) {
      throw new ForbiddenException(
        'Tidak ada cabang aktif. Pilih cabang dulu sebelum membuat transaksi.',
      );
    }
    return this.transactionsService.create(dto, req.user.id, req.user.shopId);
  }

  @Get()
  @ApiOperation({ summary: 'List transaksi (dengan filter & pagination)' })
  async findAll(@Query() query: QueryTransactionDto) {
    return this.transactionsService.findAll(query);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Dashboard stats (omzet, profit, hutang, diskon)' })
  async getStats(
    @Query('shopId') shopId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.transactionsService.getStats(shopId, startDate, endDate);
  }

  // ============================================
  // SAVE BILL (park as PENDING)
  // ============================================

  @Post('save-bill')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Simpan bill (transaksi PENDING, belum bayar)' })
  async saveBill(@Body() dto: CreateTransactionDto, @Request() req: any) {
    if (!req.user.shopId) {
      throw new ForbiddenException('Tidak ada cabang aktif.');
    }
    return this.transactionsService.saveBill(dto, req.user.id, req.user.shopId);
  }

  @Get('saved-bills')
  @ApiOperation({ summary: 'List bill tersimpan (status PENDING) untuk user aktif' })
  async listSavedBills(@Request() req: any) {
    if (!req.user.shopId) {
      throw new ForbiddenException('Tidak ada cabang aktif.');
    }
    return this.transactionsService.listSavedBills(req.user.id, req.user.shopId);
  }

  @Post('load-bill/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Load bill tersimpan ke cart (return items)' })
  async loadBill(@Param('id') id: string, @Request() req: any) {
    return this.transactionsService.loadBill(id, req.user.id, req.user.shopId);
  }

  @Post('discard-bill/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Hapus bill tersimpan (delete transaksi PENDING)' })
  async discardBill(@Param('id') id: string, @Request() req: any) {
    return this.transactionsService.discardBill(id, req.user.id, req.user.shopId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detail transaksi by ID' })
  async findOne(@Param('id') id: string) {
    return this.transactionsService.findOne(id);
  }

  @Post(':id/void')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @RequirePermission('transactions.void')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Void/batalkan transaksi (admin only, butuh OTP)' })
  async voidTransaction(
    @Param('id') id: string,
    @Body() dto: VoidTransactionDto,
    @Request() req: any,
  ) {
    return this.transactionsService.voidTransaction(id, dto, req.user);
  }
}
