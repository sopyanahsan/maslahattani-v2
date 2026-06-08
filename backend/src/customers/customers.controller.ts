import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CustomersService } from './customers.service';
import { CreateCustomerDto, UpdateCustomerDto, QueryCustomersDto } from './dto';
import { JwtAuthGuard } from '../auth/guards';
import { ShopScopeGuard } from '../auth/guards/shop-scope.guard';

@Controller('api/customers')
@UseGuards(JwtAuthGuard, ShopScopeGuard)
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Get()
  async listCustomers(@Query() query: QueryCustomersDto) {
    return this.customersService.listCustomers(query);
  }

  /**
   * Real-time duplicate name check endpoint.
   * GET /api/customers/check-name?shopId=xxx&name=yyy&excludeId=zzz
   */
  @Get('check-name')
  async checkName(
    @Query('shopId') shopId: string,
    @Query('name') name: string,
    @Query('excludeId') excludeId?: string,
  ) {
    return this.customersService.checkName(shopId, name, excludeId);
  }

  @Post()
  async createCustomer(@Body() dto: CreateCustomerDto) {
    return this.customersService.createCustomer(dto);
  }

  @Patch(':id')
  async updateCustomer(@Param('id') id: string, @Body() dto: UpdateCustomerDto) {
    return this.customersService.updateCustomer(id, dto);
  }

  @Delete(':id')
  async deleteCustomer(@Param('id') id: string) {
    return this.customersService.deleteCustomer(id);
  }
}
