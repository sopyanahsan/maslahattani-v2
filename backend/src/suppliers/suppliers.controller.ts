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
  Request,
} from '@nestjs/common';
import { SuppliersService } from './suppliers.service';
import {
  CreateSupplierDto,
  UpdateSupplierDto,
  CreatePurchaseOrderDto,
  ReceivePurchaseOrderDto,
  QuerySuppliersDto,
  QueryPurchaseOrdersDto,
} from './dto';
import { JwtAuthGuard } from '../auth/guards';

@Controller('api/suppliers')
@UseGuards(JwtAuthGuard)
export class SuppliersController {
  constructor(private readonly suppliersService: SuppliersService) {}

  // ============================================
  // SUPPLIERS
  // ============================================

  @Get()
  async listSuppliers(@Query() query: QuerySuppliersDto) {
    return this.suppliersService.listSuppliers(query);
  }

  @Post()
  async createSupplier(@Body() dto: CreateSupplierDto) {
    return this.suppliersService.createSupplier(dto);
  }

  @Patch(':id')
  async updateSupplier(@Param('id') id: string, @Body() dto: UpdateSupplierDto) {
    return this.suppliersService.updateSupplier(id, dto);
  }

  @Delete(':id')
  async deleteSupplier(@Param('id') id: string) {
    return this.suppliersService.deleteSupplier(id);
  }

  // ============================================
  // PURCHASE ORDERS
  // ============================================

  @Get('purchase-orders')
  async listPurchaseOrders(@Query() query: QueryPurchaseOrdersDto) {
    return this.suppliersService.listPurchaseOrders(query);
  }

  @Get('purchase-orders/:id')
  async getPurchaseOrder(@Param('id') id: string) {
    return this.suppliersService.getPurchaseOrder(id);
  }

  @Post('purchase-orders')
  async createPurchaseOrder(
    @Body() dto: CreatePurchaseOrderDto,
    @Request() req: any,
  ) {
    const createdById = req.user.sub || req.user.id;
    return this.suppliersService.createPurchaseOrder(dto, createdById);
  }

  @Post('purchase-orders/:id/order')
  async markOrdered(@Param('id') id: string) {
    return this.suppliersService.markOrdered(id);
  }

  @Post('purchase-orders/:id/receive')
  async markReceived(@Param('id') id: string, @Body() body: ReceivePurchaseOrderDto) {
    return this.suppliersService.markReceived(id, body?.items);
  }

  @Post('purchase-orders/:id/cancel')
  async cancelPO(@Param('id') id: string) {
    return this.suppliersService.cancelPO(id);
  }
}
