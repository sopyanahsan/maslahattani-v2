import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { TransfersService } from './transfers.service';
import {
  CreateTransferDto,
  ApprovalNotesDto,
  ReceiveTransferDto,
  QueryTransfersDto,
} from './dto';
import { JwtAuthGuard } from '../auth/guards';

@Controller('api/transfers')
@UseGuards(JwtAuthGuard)
export class TransfersController {
  constructor(private readonly transfersService: TransfersService) {}

  @Get()
  async listTransfers(@Query() query: QueryTransfersDto) {
    return this.transfersService.listTransfers(query);
  }

  @Get(':id')
  async getTransfer(@Param('id') id: string) {
    return this.transfersService.getTransfer(id);
  }

  @Post()
  async createTransfer(@Body() dto: CreateTransferDto, @Request() req: any) {
    const requestedById = req.user.sub || req.user.id;
    return this.transfersService.createTransfer(dto, requestedById);
  }

  @Post(':id/approve')
  async approveTransfer(@Param('id') id: string, @Request() req: any) {
    const approvedById = req.user.sub || req.user.id;
    return this.transfersService.approveTransfer(id, approvedById);
  }

  @Post(':id/reject')
  async rejectTransfer(
    @Param('id') id: string,
    @Body() dto: ApprovalNotesDto,
    @Request() req: any,
  ) {
    const approvedById = req.user.sub || req.user.id;
    return this.transfersService.rejectTransfer(id, approvedById, dto);
  }

  @Post(':id/ship')
  async shipTransfer(@Param('id') id: string) {
    return this.transfersService.shipTransfer(id);
  }

  @Post(':id/receive')
  async receiveTransfer(@Param('id') id: string, @Body() dto: ReceiveTransferDto) {
    return this.transfersService.receiveTransfer(id, dto);
  }

  @Post(':id/cancel')
  async cancelTransfer(@Param('id') id: string) {
    return this.transfersService.cancelTransfer(id);
  }
}
