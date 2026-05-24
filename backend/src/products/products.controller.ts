import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard, Roles } from '../auth/guards/roles.guard';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { QueryProductDto } from './dto/query-product.dto';
import { Role } from '@prisma/client';

@ApiTags('Products')
@Controller('api/products')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Tambah produk baru (admin only)' })
  async create(@Body() dto: CreateProductDto) {
    return this.productsService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'List produk (dengan search & pagination)' })
  async findAll(@Query() query: QueryProductDto) {
    return this.productsService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detail produk by ID (include stok & history)' })
  async findOne(@Param('id') id: string) {
    return this.productsService.findOne(id);
  }

  @Put(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Update produk (admin only)' })
  async update(@Param('id') id: string, @Body() dto: UpdateProductDto) {
    return this.productsService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Hapus produk / soft delete (admin only)' })
  async remove(@Param('id') id: string) {
    return this.productsService.remove(id);
  }
}
