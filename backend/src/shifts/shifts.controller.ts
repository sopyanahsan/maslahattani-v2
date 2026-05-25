import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard, Roles } from '../auth/guards/roles.guard';
import { ShiftsService } from './shifts.service';
import { OpenShiftDto } from './dto/open-shift.dto';
import { CloseShiftDto } from './dto/close-shift.dto';
import { FinalizeShiftDto } from './dto/finalize-shift.dto';
import { QueryShiftDto } from './dto/query-shift.dto';
import { Role } from '@prisma/client';

@ApiTags('Shifts / Clerek')
@Controller('api/shifts')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ShiftsController {
  constructor(private readonly shiftsService: ShiftsService) {}

  @Post('open')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Buka shift kasir (admin only)' })
  async openShift(@Body() dto: OpenShiftDto) {
    return this.shiftsService.openShift(dto);
  }

  @Post(':id/close')
  @ApiOperation({ summary: 'Tutup shift (hitung expected cash/QRIS otomatis)' })
  async closeShift(@Param('id') id: string, @Body() dto: CloseShiftDto) {
    return this.shiftsService.closeShift(id, dto);
  }

  @Post(':id/finalize')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Finalisasi clerek - input uang fisik, hitung selisih (admin only)' })
  async finalizeShift(
    @Param('id') id: string,
    @Body() dto: FinalizeShiftDto,
    @Request() req: any,
  ) {
    return this.shiftsService.finalizeShift(id, dto, req.user);
  }

  @Get()
  @ApiOperation({ summary: 'List shifts (filter: shop, user, date, status)' })
  async findAll(@Query() query: QueryShiftDto) {
    return this.shiftsService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detail shift by ID' })
  async findOne(@Param('id') id: string) {
    return this.shiftsService.findOne(id);
  }
}
