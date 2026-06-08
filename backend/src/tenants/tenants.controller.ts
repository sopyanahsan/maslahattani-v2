import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { TenantsService, RegisterTenantDto } from './tenants.service';
import { SkipSubscription } from '../subscription/skip-subscription.decorator';

@ApiTags('Tenants / Registrasi')
@Controller('api/tenants')
@SkipSubscription()
export class TenantsController {
  constructor(private readonly tenantsService: TenantsService) {}

  @Post('register')
  @ApiOperation({
    summary: 'Register tenant baru (dari landing page)',
    description:
      'Buat Tenant + User (SUPER_ADMIN) + Shop + Subscription (TRIAL 14 hari). ' +
      'Tidak perlu auth — endpoint public.',
  })
  async register(@Body() dto: RegisterTenantDto) {
    return this.tenantsService.register(dto);
  }
}
