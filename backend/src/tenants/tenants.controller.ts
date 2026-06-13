import { Controller, Post, Get, Put, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { TenantsService, RegisterTenantDto } from './tenants.service';
import { SkipSubscription } from '../subscription/skip-subscription.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard, Roles } from '../auth/guards/roles.guard';
import { Role } from '@prisma/client';

@ApiTags('Tenants / Registrasi')
@Controller('api/tenants')
@SkipSubscription()
export class TenantsController {
  constructor(private readonly tenantsService: TenantsService) {}

  @Post('register')
  @ApiOperation({ summary: 'Register tenant baru (dari landing page — public)' })
  async register(@Body() dto: RegisterTenantDto) {
    return this.tenantsService.register(dto);
  }

  // ============================================
  // OWNER DASHBOARD ENDPOINTS (platform owner only)
  // ============================================

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.DEVELOPER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List all tenants with subscription info (owner dashboard)' })
  async listTenants(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('status') status?: string,
  ) {
    return this.tenantsService.listTenants(
      Number(page) || 1,
      Number(limit) || 20,
      search,
      status,
    );
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.DEVELOPER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get tenant detail (owner dashboard)' })
  async getTenant(@Param('id') id: string) {
    return this.tenantsService.getTenantDetail(id);
  }

  @Put(':id/activate')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.DEVELOPER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Activate subscription (after payment verification)' })
  async activateTenant(
    @Param('id') tenantId: string,
    @Body() body: { plan: string; cycle: string },
  ) {
    return this.tenantsService.activateTenant(tenantId, body.plan, body.cycle);
  }

  @Put(':id/suspend')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.DEVELOPER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Suspend tenant (manual block)' })
  async suspendTenant(@Param('id') tenantId: string) {
    return this.tenantsService.suspendTenant(tenantId);
  }

  // ============================================
  // PAYMENT VERIFICATION
  // ============================================

  @Get('payments/pending')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.DEVELOPER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List pending payments (for owner to verify)' })
  async listPendingPayments(@Query('page') page?: string) {
    return this.tenantsService.listPendingPayments(Number(page) || 1);
  }

  @Put('payments/:id/verify')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.DEVELOPER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Verify payment → activate subscription' })
  async verifyPayment(@Param('id') paymentId: string, @Body() body: { notes?: string }) {
    return this.tenantsService.verifyPayment(paymentId, body.notes);
  }

  @Put('payments/:id/reject')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.DEVELOPER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Reject payment' })
  async rejectPayment(@Param('id') paymentId: string, @Body() body: { reason: string }) {
    return this.tenantsService.rejectPayment(paymentId, body.reason);
  }

  // ============================================
  // OWNER DASHBOARD STATS
  // ============================================

  @Get('stats/overview')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.DEVELOPER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Platform stats: total tenants, MRR, etc' })
  async getStats() {
    return this.tenantsService.getPlatformStats();
  }
}
