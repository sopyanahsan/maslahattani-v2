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
import { RacksService } from './racks.service';
import {
  CreateRackZoneDto,
  UpdateRackZoneDto,
  CreateRackDto,
  UpdateRackDto,
  AssignRackDto,
} from './dto';
import { JwtAuthGuard } from '../auth/guards';
import { ShopScopeGuard } from '../auth/guards/shop-scope.guard';

@Controller('api/racks')
@UseGuards(JwtAuthGuard, ShopScopeGuard)
export class RacksController {
  constructor(private readonly racksService: RacksService) {}

  // ============================================
  // ZONES
  // ============================================

  @Get('zones')
  async listZones(@Query('shopId') shopId: string) {
    return this.racksService.listZones(shopId);
  }

  @Post('zones')
  async createZone(@Body() dto: CreateRackZoneDto) {
    return this.racksService.createZone(dto);
  }

  @Patch('zones/:id')
  async updateZone(@Param('id') id: string, @Body() dto: UpdateRackZoneDto) {
    return this.racksService.updateZone(id, dto);
  }

  @Delete('zones/:id')
  async deleteZone(@Param('id') id: string) {
    return this.racksService.deleteZone(id);
  }

  // ============================================
  // RACKS
  // ============================================

  @Get()
  async listRacks(
    @Query('shopId') shopId: string,
    @Query('zoneId') zoneId?: string,
  ) {
    return this.racksService.listRacks(shopId, zoneId);
  }

  @Get('unassigned-products')
  async getUnassignedProducts(
    @Query('shopId') shopId: string,
    @Query('search') search?: string,
  ) {
    return this.racksService.getUnassignedProducts(shopId, search);
  }

  @Post()
  async createRack(@Body() dto: CreateRackDto) {
    return this.racksService.createRack(dto);
  }

  @Patch(':id')
  async updateRack(@Param('id') id: string, @Body() dto: UpdateRackDto) {
    return this.racksService.updateRack(id, dto);
  }

  @Delete(':id')
  async deleteRack(@Param('id') id: string) {
    return this.racksService.deleteRack(id);
  }

  @Get(':id/products')
  async getProductsByRack(@Param('id') id: string) {
    return this.racksService.getProductsByRack(id);
  }

  // ============================================
  // ASSIGN PRODUCT TO RACK
  // ============================================

  @Patch('assign/:stockId')
  async assignRack(
    @Param('stockId') stockId: string,
    @Body() dto: AssignRackDto,
  ) {
    return this.racksService.assignProductToRack(stockId, dto.rackId ?? null);
  }
}
