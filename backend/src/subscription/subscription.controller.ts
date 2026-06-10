import { Controller, Get, Post, Body, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SkipSubscription } from './skip-subscription.decorator';
import { SubscriptionService } from './subscription.service';
import { PrismaService } from '../prisma/prisma.service';
import { PLAN_PRICING } from './plan-config';

@ApiTags('Subscription / Billing')
@Controller('api/subscription')
@UseGuards(JwtAuthGuard)
@SkipSubscription()
@ApiBearerAuth()
export class SubscriptionController {
  constructor(
    private readonly subscriptionService: SubscriptionService,
    private readonly prisma: PrismaService,
  ) {}

  @Get('me')
  @ApiOperation({ summary: 'Get current tenant subscription status' })
  async getMySubscription(@Request() req: any) {
    const tenantId = req.user.tenantId;
    if (!tenantId) {
      return { plan: null, status: null, message: 'No tenant linked.' };
    }
    const sub = await this.subscriptionService.getSubscription(tenantId);
    return sub;
  }

  @Get('pricing')
  @ApiOperation({ summary: 'Get pricing info (public-ish, needs auth for tenant context)' })
  async getPricing() {
    return { plans: PLAN_PRICING };
  }

  @Post('payment')
  @ApiOperation({ summary: 'Submit payment record (tenant confirms they transferred)' })
  async submitPayment(
    @Request() req: any,
    @Body() body: { plan: string; cycle: string; method: string; amount: number; uniqueCode?: string },
  ) {
    const tenantId = req.user.tenantId;
    if (!tenantId) {
      return { success: false, message: 'No tenant linked to this user.' };
    }

    const payment = await this.prisma.saasPayment.create({
      data: {
        tenantId,
        plan: body.plan as any,
        cycle: body.cycle as any,
        method: body.method || 'MANUAL_TRANSFER',
        amount: body.amount,
        uniqueCode: body.uniqueCode || null,
        status: 'PENDING',
      },
    });

    return {
      success: true,
      message: 'Pembayaran tercatat. Admin akan verifikasi dalam 1x24 jam.',
      paymentId: payment.id,
    };
  }
}
