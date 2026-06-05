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
import {
  CreateOpnameSessionDto,
  UpdateOpnameItemDto,
  QueryOpnameSessionsDto,
  JoinOpnameSessionDto,
} from './dto';
import { JwtAuthGuard } from '../auth/guards';
import { ShopScopeGuard } from '../auth/guards/shop-scope.guard';

@Controller('api/opname')
export class OpnameController {
  constructor(private readonly opnameService: OpnameService) {}

  // ============================================
  // SESSIONS (Protected - Admin Panel)
  // ============================================

  @Get('sessions')
  @UseGuards(JwtAuthGuard, ShopScopeGuard)
  async listSessions(@Query() query: QueryOpnameSessionsDto) {
    return this.opnameService.listSessions(query);
  }

  @Get('sessions/:id')
  @UseGuards(JwtAuthGuard, ShopScopeGuard)
  async getSession(@Param('id') id: string) {
    return this.opnameService.getSession(id);
  }

  @Post('sessions')
  @UseGuards(JwtAuthGuard, ShopScopeGuard)
  async createSession(
    @Body() dto: CreateOpnameSessionDto,
    @Request() req: any,
  ) {
    const conductorId = req.user.sub || req.user.id;
    return this.opnameService.createSession(dto, conductorId);
  }

  @Post('sessions/:id/complete')
  @UseGuards(JwtAuthGuard, ShopScopeGuard)
  async completeSession(
    @Param('id') id: string,
    @Body() body: { applyAdjustments?: boolean },
  ) {
    return this.opnameService.completeSession(id, body.applyAdjustments ?? false);
  }

  @Post('sessions/:id/cancel')
  @UseGuards(JwtAuthGuard, ShopScopeGuard)
  async cancelSession(@Param('id') id: string) {
    return this.opnameService.cancelSession(id);
  }

  // ============================================
  // PASSCODE - Public endpoints for webapp
  // ============================================

  /**
   * Lookup session by passcode (webapp uses this to show session info
   * before the user commits to joining).
   */
  @Get('join/:passcode')
  async getSessionByPasscode(@Param('passcode') passcode: string) {
    return this.opnameService.getSessionByPasscode(passcode);
  }

  /**
   * Join an opname session via passcode.
   * Creates a participant record and returns session details + items.
   */
  @Post('join')
  async joinSession(@Body() dto: JoinOpnameSessionDto) {
    return this.opnameService.joinSessionByPasscode(dto);
  }

  /**
   * Get session detail (public - for webapp petugas after joining).
   * Same data as GET /sessions/:id but without JWT requirement.
   */
  @Get('public/sessions/:id')
  async getSessionPublic(@Param('id') id: string) {
    return this.opnameService.getSession(id);
  }

  /**
   * Notify that a participant has finished counting all items.
   * Marks the session as ready for admin review.
   */
  @Post('public/sessions/:id/counting-complete')
  async notifyCountingComplete(
    @Param('id') id: string,
    @Body() body: { participantId: string },
  ) {
    return this.opnameService.markCountingComplete(id, body.participantId);
  }

  // ============================================
  // ITEMS (Protected for admin, will also be used by webapp via participant)
  // ============================================

  @Patch('items/:itemId')
  @UseGuards(JwtAuthGuard, ShopScopeGuard)
  async updateItem(
    @Param('itemId') itemId: string,
    @Body() dto: UpdateOpnameItemDto,
  ) {
    return this.opnameService.updateItem(itemId, dto);
  }

  /**
   * Update item from webapp (no JWT required, but needs valid participantId).
   * This allows petugas to submit counts without having a full user account.
   */
  @Patch('public/items/:itemId')
  async updateItemPublic(
    @Param('itemId') itemId: string,
    @Body() dto: UpdateOpnameItemDto,
  ) {
    return this.opnameService.updateItem(itemId, dto);
  }
}
