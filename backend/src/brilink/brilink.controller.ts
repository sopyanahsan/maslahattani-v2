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
import { BrilinkService } from './brilink.service';
import {
  CreateBrilinkTransactionDto,
  CreateBrilinkFeeDto,
  UpdateBrilinkFeeDto,
  QueryBrilinkTransactionsDto,
} from './dto';
import { JwtAuthGuard } from '../auth/guards';
import { ShopScopeGuard } from '../auth/guards/shop-scope.guard';

@Controller('api/brilink')
@UseGuards(JwtAuthGuard, ShopScopeGuard)
export class BrilinkController {
  constructor(private readonly brilinkService: BrilinkService) {}

  // ============================================
  // TRANSACTIONS
  // ============================================

  @Get('transactions')
  async listTransactions(@Query() query: QueryBrilinkTransactionsDto) {
    return this.brilinkService.listTransactions(query);
  }

  @Post('transactions')
  async createTransaction(
    @Body() dto: CreateBrilinkTransactionDto,
    @Request() req: any,
  ) {
    const shopId = req.user.shopId;
    const cashierId = req.user.sub || req.user.id;
    return this.brilinkService.createTransaction(dto, shopId, cashierId);
  }

  // ============================================
  // STATS
  // ============================================

  @Get('stats')
  async getStats(@Query('shopId') shopId: string) {
    return this.brilinkService.getStats(shopId);
  }

  // ============================================
  // FEES
  // ============================================

  @Get('fees')
  async listFees(@Query('shopId') shopId: string) {
    return this.brilinkService.listFees(shopId);
  }

  @Post('fees')
  async createFee(@Body() dto: CreateBrilinkFeeDto) {
    return this.brilinkService.createFee(dto);
  }

  @Patch('fees/:id')
  async updateFee(@Param('id') id: string, @Body() dto: UpdateBrilinkFeeDto) {
    return this.brilinkService.updateFee(id, dto);
  }

  @Delete('fees/:id')
  async deleteFee(@Param('id') id: string) {
    return this.brilinkService.deleteFee(id);
  }
}
