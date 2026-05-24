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
import { StockService } from './stock.service';
import { StockInDto } from './dto/stock-in.dto';
import { StockOpnameDto } from './dto/stock-opname.dto';
import { QueryStockHistoryDto } from './dto/query-stock.dto';
import { Role } from '@prisma/client';

@ApiTags('Stock')
@Controller('api/stock')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class StockController {
  constructor(private readonly stockService: StockService) {}

  @Get()
  @ApiOperation({ summary: 'List semua stok by shop (include summary)' })
  async findAll(@Query('shopId') shopId: string) {
    return this.stockService.findAll(shopId);
  }

  @Post('in')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Stok masuk / restok (admin only)' })
  async stockIn(@Body() dto: StockInDto) {
    return this.stockService.stockIn(dto);
  }

  @Post('opname')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Stok opname - penyesuaian stok fisik (admin only)' })
  async opname(@Body() dto: StockOpnameDto) {
    return this.stockService.opname(dto);
  }

  @Get('history')
  @ApiOperation({ summary: 'Riwayat pergerakan stok (filter by product, type, date)' })
  async getHistory(@Query() query: QueryStockHistoryDto) {
    return this.stockService.getHistory(query);
  }
}
