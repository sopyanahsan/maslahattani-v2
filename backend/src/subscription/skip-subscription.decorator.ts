import { SetMetadata } from '@nestjs/common';
import { SKIP_SUBSCRIPTION_CHECK } from './subscription.guard';

/**
 * Decorator: @SkipSubscription()
 * Put on controllers/methods that should NOT check subscription status.
 * Used for: auth, health, billing, registration, landing page endpoints.
 */
export const SkipSubscription = () => SetMetadata(SKIP_SUBSCRIPTION_CHECK, true);
