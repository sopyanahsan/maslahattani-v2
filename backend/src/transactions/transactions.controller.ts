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
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard, Roles } from '../auth/guards/roles.guard';
import { TransactionsService } from './transactions.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { VoidTransactionDto } from './dto/void-transaction.dto';
import { QueryTransactionDto } from './dto/query-transaction.dto';
import { Role } from '@prisma/client';

@ApiTags('Transactions')
@Controller('api/transactions')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Buat transaksi baru (POS - kasir)' })
  async create(@Body() dto: CreateTransactionDto, @Request() req: any) {
    return this.transactionsService.create(dto, req.user.id);
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

  @Get(':id')
  @ApiOperation({ summary: 'Detail transaksi by ID' })
  async findOne(@Param('id') id: string) {
    return this.transactionsService.findOne(id);
  }

  @Post(':id/void')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
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
