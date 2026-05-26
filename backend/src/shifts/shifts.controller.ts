import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { ShiftsService } from './shifts.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard, Roles } from '../auth/guards/roles.guard';
import { Role } from '@prisma/client';
import {
  OpenShiftDto,
  CloseShiftDto,
  QueryShiftDto,
  FinalizeShiftDto,
} from './dto';

@ApiTags('Shifts')
@Controller('api/shifts')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class ShiftsController {
  constructor(private readonly shiftsService: ShiftsService) {}

  @Post('open')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Buka shift baru',
    description: 'Kasir buka shift di awal hari kerja. Input saldo kas awal.',
  })
  async openShift(@Request() req: any, @Body() dto: OpenShiftDto) {
    return this.shiftsService.openShift(req.user.id, req.user.shopId, dto);
  }

  @Post(':id/close')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Tutup shift',
    description:
      'Kasir tutup shift di akhir hari kerja. Input actual cash & QRIS. System auto-calculate variance.',
  })
  @ApiParam({ name: 'id', description: 'Shift ID' })
  async closeShift(
    @Param('id') shiftId: string,
    @Request() req: any,
    @Body() dto: CloseShiftDto,
  ) {
    return this.shiftsService.closeShift(
      shiftId,
      req.user.id,
      req.user.role,
      dto,
    );
  }

  @Get()
  @ApiOperation({
    summary: 'List shifts',
    description:
      'List semua shift dengan filter. Non-superadmin hanya lihat shift di cabang mereka.',
  })
  async listShifts(@Query() query: QueryShiftDto, @Request() req: any) {
    return this.shiftsService.listShifts(
      query,
      req.user.role,
      req.user.shopId,
    );
  }

  @Get('current')
  @ApiOperation({
    summary: 'Get current open shift',
    description:
      'Helper untuk kasir cek apakah ada shift aktif. Return null jika belum buka shift.',
  })
  async getCurrentShift(@Request() req: any) {
    return this.shiftsService.getCurrentShift(req.user.id, req.user.shopId);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Detail shift',
    description:
      'Detail shift + list transaksi dalam shift. Non-superadmin hanya bisa lihat shift di cabang mereka.',
  })
  @ApiParam({ name: 'id', description: 'Shift ID' })
  async getShiftDetail(@Param('id') shiftId: string, @Request() req: any) {
    return this.shiftsService.getShiftDetail(
      shiftId,
      req.user.role,
      req.user.shopId,
    );
  }

  @Post(':id/finalize')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Finalize shift (Admin only)',
    description:
      'Admin review & approve shift yang sudah ditutup. Setelah difinalkan, shift tidak bisa diubah lagi.',
  })
  @ApiParam({ name: 'id', description: 'Shift ID' })
  async finalizeShift(
    @Param('id') shiftId: string,
    @Request() req: any,
    @Body() dto: FinalizeShiftDto,
  ) {
    return this.shiftsService.finalizeShift(
      shiftId,
      req.user.username || req.user.email,
      dto,
    );
  }
}
