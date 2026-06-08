import { Module, Global } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { SubscriptionGuard } from './subscription.guard';
import { SubscriptionService } from './subscription.service';
import { PrismaModule } from '../prisma/prisma.module';

/**
 * SubscriptionModule — Global module for SaaS subscription enforcement.
 * SubscriptionGuard registered as APP_GUARD (runs on every request).
 * Skipped for: auth endpoints, health, billing, landing page.
 */
@Global()
@Module({
  imports: [PrismaModule],
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
