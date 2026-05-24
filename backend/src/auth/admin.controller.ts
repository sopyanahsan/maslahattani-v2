import {
  Controller,
  Get,
  Post,
  Put,
  Param,
  Body,
  UseGuards,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard, Roles } from './guards/roles.guard';
import { AdminService } from './admin.service';
import { CreateKasirDto, UpdateKasirDto } from './dto/admin-user.dto';
import { Role } from '@prisma/client';

@ApiTags('Admin - User Management')
@Controller('api/admin/kasir')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get()
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'List semua kasir' })
  async listKasir(@Query('shopId') shopId?: string) {
    return this.adminService.listKasir(shopId);
  }

  @Post()
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Buat kasir baru (dengan suggested username)' })
  async createKasir(@Body() dto: CreateKasirDto) {
    return this.adminService.createKasir(dto);
  }

  @Put(':id')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Update kasir (status, assign shop)' })
  async updateKasir(@Param('id') id: string, @Body() dto: UpdateKasirDto) {
    return this.adminService.updateKasir(id, dto);
  }

  @Post(':id/reset-password')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Reset password kasir (generate temp password)' })
  async resetKasirPassword(@Param('id') id: string) {
    return this.adminService.resetKasirPassword(id);
  }

  @Get('suggest-username')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Suggest username berdasarkan email' })
  async suggestUsername(@Query('email') email: string) {
    return this.adminService.suggestUsername(email);
  }
}
