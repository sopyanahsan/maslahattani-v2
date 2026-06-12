import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { BrilinkProductsService } from './brilink-products.service';
import {
  CreateBrilinkProductDto,
  UpdateBrilinkProductDto,
  QueryBrilinkProductsDto,
  SeedProductsDto,
} from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('BRILink Products & Operators')
@Controller('api/brilink')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class BrilinkProductsController {
  constructor(private readonly service: BrilinkProductsService) {}

  // ============================================
  // OPERATOR DETECTION
  // ============================================

  @Get('operators/detect')
  @ApiOperation({ summary: 'Auto-detect operator dari nomor HP' })
  async detectOperator(@Query('phone') phone: string) {
    return this.service.detectOperator(phone);
  }

  @Get('operators')
  @ApiOperation({ summary: 'List semua operator prefix' })
  async getAllPrefixes() {
    return this.service.getAllPrefixes();
  }

  // ============================================
  // PRODUCTS CRUD
  // ============================================

  @Get('products')
  @ApiOperation({ summary: 'List produk BRILink per shop (pulsa, data, ewallet, PLN)' })
  async listProducts(@Query() query: QueryBrilinkProductsDto) {
    return this.service.listProducts(query);
  }

  @Post('products')
  @ApiOperation({ summary: 'Tambah produk baru' })
  async createProduct(@Body() dto: CreateBrilinkProductDto) {
    return this.service.createProduct(dto);
  }

  @Patch('products/:id')
  @ApiOperation({ summary: 'Update produk (harga, nama, aktif)' })
  async updateProduct(@Param('id') id: string, @Body() dto: UpdateBrilinkProductDto) {
    return this.service.updateProduct(id, dto);
  }

  @Delete('products/:id')
  @ApiOperation({ summary: 'Hapus produk' })
  async deleteProduct(@Param('id') id: string) {
    return this.service.deleteProduct(id);
  }

  @Post('products/seed')
  @ApiOperation({ summary: 'Seed produk dari template (standard/premium/economy)' })
  async seedProducts(@Body() dto: SeedProductsDto) {
    return this.service.seedProducts(dto);
  }

  @Get('products/bulk-template')
  @ApiOperation({ summary: 'Download template Excel untuk bulk upload produk BRILink' })
  async downloadTemplate(@Res() res: Response) {
    const buffer = this.service.generateBulkTemplate();
    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename="template-produk-brilink.xlsx"',
      'Content-Length': buffer.length.toString(),
    });
    res.end(buffer);
  }

  @Post('products/bulk-upload')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload massal produk BRILink dari file Excel' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
        shopId: { type: 'string' },
      },
    },
  })
  async bulkUpload(
    @UploadedFile() file: any,
    @Body('shopId') shopId: string,
  ) {
    if (!file) {
      throw new BadRequestException('File tidak ditemukan. Upload file .xlsx.');
    }
    if (!shopId) {
      throw new BadRequestException('shopId wajib diisi.');
    }
    return this.service.bulkUpload(shopId, file.buffer);
  }

  // ============================================
  // BANK LIST
  // ============================================

  @Get('banks')
  @ApiOperation({ summary: 'List daftar bank (searchable, filterable)' })
  async listBanks(
    @Query('search') search?: string,
    @Query('isActive') isActive?: string,
  ) {
    const active = isActive === 'true' ? true : isActive === 'false' ? false : undefined;
    return this.service.listBanks(search, active);
  }

  @Patch('banks/:id/toggle')
  @ApiOperation({ summary: 'Toggle aktif/nonaktif bank' })
  async toggleBank(@Param('id') id: string, @Body() body: { isActive: boolean }) {
    return this.service.toggleBank(id, body.isActive);
  }

  // ============================================
  // E-WALLET PROVIDERS
  // ============================================

  @Get('ewallet-providers')
  @ApiOperation({ summary: 'List e-wallet providers' })
  async listEwalletProviders() {
    return this.service.listEwalletProviders();
  }

  @Patch('ewallet-providers/:id/toggle')
  @ApiOperation({ summary: 'Toggle aktif/nonaktif e-wallet provider' })
  async toggleEwalletProvider(@Param('id') id: string, @Body() body: { isActive: boolean }) {
    return this.service.toggleEwalletProvider(id, body.isActive);
  }
}
