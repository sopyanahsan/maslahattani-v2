import { Module, Global } from '@nestjs/common';
import { RealtimeGateway } from './realtime.gateway';

/**
 * RealtimeModule — Global module sehingga RealtimeGateway bisa di-inject
 * di service manapun tanpa perlu import module ini di setiap module.
 */
@Global()
@Module({
  providers: [RealtimeGateway],
  exports: [RealtimeGateway],
})
export class RealtimeModule {}
