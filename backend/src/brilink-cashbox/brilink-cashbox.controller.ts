import {
  Body,
  Controller,
  Get,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { BrilinkCashboxService } from './brilink-cashbox.service';
import {
  CashBoxActionDto,
  QueryCashMutationsDto,
  UpdateCashBoxSettingsDto,
} from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('BRILink Kas Tunai')
@Controller('api/brilink/cashbox')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class BrilinkCashboxController {
  constructor(private readonly service: BrilinkCashboxService) {}

  @Get()
  @ApiOperation({ summary: 'Get kas tunai BRILink (auto-create if not exists)' })
  async getCashBox(@Query('shopId') shopId: string) {
    return this.service.getCashBox(shopId);
  }

  @Post('setor')
  @ApiOperation({ summary: 'Tambah modal kas tunai BRILink' })
  async setor(
    @Query('shopId') shopId: string,
    @Body() dto: CashBoxActionDto,
    @Req() req: any,
  ) {
    const userId = req.user?.id || req.user?.sub;
    return this.service.setor(shopId, dto, userId);
  }

  @Post('tarik')
  @ApiOperation({ summary: 'Ambil tunai dari kas BRILink' })
  async tarik(
    @Query('shopId') shopId: string,
    @Body() dto: CashBoxActionDto,
    @Req() req: any,
  ) {
    const userId = req.user?.id || req.user?.sub;
    return this.service.tarik(shopId, dto, userId);
  }

  @Get('mutations')
  @ApiOperation({ summary: 'List mutasi kas tunai (paginated, filterable)' })
  async getMutations(@Query() query: QueryCashMutationsDto) {
    return this.service.getMutations(query);
  }

  @Patch('settings')
  @ApiOperation({ summary: 'Update pengaturan kas tunai (threshold, notes)' })
  async updateSettings(
    @Query('shopId') shopId: string,
    @Body() dto: UpdateCashBoxSettingsDto,
  ) {
    return this.service.updateSettings(shopId, dto);
  }
}
