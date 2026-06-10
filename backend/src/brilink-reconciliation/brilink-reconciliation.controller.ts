import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { BrilinkReconciliationService } from './brilink-reconciliation.service';
import { ReconcileDto, QueryReconciliationHistoryDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('BRILink Reconciliation')
@Controller('api/brilink/reconciliation')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class BrilinkReconciliationController {
  constructor(private readonly service: BrilinkReconciliationService) {}

  @Post()
  @ApiOperation({ summary: 'Reconcile saldo (cocokkan app vs real)' })
  async reconcile(
    @Body() dto: ReconcileDto,
    @Query('shopId') shopId: string,
    @Req() req: any,
  ) {
    const userId = req.user?.id || req.user?.sub;
    return this.service.reconcile(dto, shopId, userId);
  }

  @Get('history')
  @ApiOperation({ summary: 'Riwayat reconciliation (paginated)' })
  async getHistory(@Query() query: QueryReconciliationHistoryDto) {
    return this.service.getHistory(query);
  }
}
