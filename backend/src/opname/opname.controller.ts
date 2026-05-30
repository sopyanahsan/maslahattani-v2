import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { OpnameService } from './opname.service';
import { CreateOpnameSessionDto, UpdateOpnameItemDto, QueryOpnameSessionsDto } from './dto';
import { JwtAuthGuard } from '../auth/guards';

@Controller('api/opname')
@UseGuards(JwtAuthGuard)
export class OpnameController {
  constructor(private readonly opnameService: OpnameService) {}

  // ============================================
  // SESSIONS
  // ============================================

  @Get('sessions')
  async listSessions(@Query() query: QueryOpnameSessionsDto) {
    return this.opnameService.listSessions(query);
  }

  @Get('sessions/:id')
  async getSession(@Param('id') id: string) {
    return this.opnameService.getSession(id);
  }

  @Post('sessions')
  async createSession(
    @Body() dto: CreateOpnameSessionDto,
    @Request() req: any,
  ) {
    const conductorId = req.user.sub || req.user.id;
    return this.opnameService.createSession(dto, conductorId);
  }

  @Post('sessions/:id/complete')
  async completeSession(
    @Param('id') id: string,
    @Body() body: { applyAdjustments?: boolean },
  ) {
    return this.opnameService.completeSession(id, body.applyAdjustments ?? false);
  }

  @Post('sessions/:id/cancel')
  async cancelSession(@Param('id') id: string) {
    return this.opnameService.cancelSession(id);
  }

  // ============================================
  // ITEMS
  // ============================================

  @Patch('items/:itemId')
  async updateItem(
    @Param('itemId') itemId: string,
    @Body() dto: UpdateOpnameItemDto,
  ) {
    return this.opnameService.updateItem(itemId, dto);
  }
}
