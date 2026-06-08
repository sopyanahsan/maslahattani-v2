import { Module, Global } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { SubscriptionGuard } from './subscription.guard';
import { SubscriptionService } from './subscription.service';
import { SubscriptionController } from './subscription.controller';
import { PrismaModule } from '../prisma/prisma.module';

/**
 * SubscriptionModule — Global module for SaaS subscription enforcement.
 * SubscriptionGuard registered as APP_GUARD (runs on every request).
 * SubscriptionController: /api/subscription/me, /api/subscription/payment
 */
@Global()
@Module({
  imports: [PrismaModule],
  controllers: [SubscriptionController],
  providers: [
    SubscriptionService,
    {
      provide: APP_GUARD,
      useClass: SubscriptionGuard,
    },
  ],
  exports: [SubscriptionService],
})
export class SubscriptionModule {}
