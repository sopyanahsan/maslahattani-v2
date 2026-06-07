import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ShopScopeGuard } from '../auth/guards/shop-scope.guard';
import { RequirePermission } from '../permissions/require-permission.guard';
import { DebtsService } from './debts.service';
import { CreateDebtDto } from './dto/create-debt.dto';
import { PayDebtDto } from './dto/pay-debt.dto';
import { UpdateDebtDto } from './dto/update-debt.dto';
import { QueryDebtDto } from './dto/query-debt.dto';

@ApiTags('Debts / Hutang')
@Controller('api/debts')
@UseGuards(JwtAuthGuard, ShopScopeGuard)
@ApiBearerAuth()
export class DebtsController {
  constructor(private readonly debtsService: DebtsService) {}

  @Post()
  @RequirePermission('debts.create')
  @ApiOperation({ summary: 'Catat hutang baru (dengan DP opsional)' })
  async create(@Body() dto: CreateDebtDto) {
    return this.debtsService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'List hutang (filter: status, customer, shop + pagination)' })
  async findAll(@Query() query: QueryDebtDto) {
    return this.debtsService.findAll(query);
  }

  @Get('by-customer/:customerName')
  @ApiOperation({ summary: 'List hutang by nama customer' })
  async findByCustomer(
    @Param('customerName') customerName: string,
    @Query('shopId') shopId: string,
  ) {
    return this.debtsService.findByCustomer(customerName, shopId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detail hutang (include riwayat pembayaran)' })
  async findOne(@Param('id') id: string) {
    return this.debtsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update hutang (jatuh tempo, catatan, info customer)' })
  async update(@Param('id') id: string, @Body() dto: UpdateDebtDto) {
    return this.debtsService.updateDebt(id, dto);
  }

  @Put(':id/payment')
  @RequirePermission('debts.pay')
  @ApiOperation({ summary: 'Bayar hutang (cicilan / lunas)' })
  async payDebt(@Param('id') id: string, @Body() dto: PayDebtDto) {
    return this.debtsService.payDebt(id, dto);
  }
}
