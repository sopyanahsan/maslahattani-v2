import { Controller, Get, Patch, Body, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PrismaService } from '../prisma/prisma.service';

@ApiTags('Profile')
@Controller('api/profile')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ProfileController {
  constructor(private prisma: PrismaService) {}

  @Get()
  @ApiOperation({ summary: 'Get profil kasir (nama, HP, alamat, foto, shift)' })
  async getProfile(@Request() req: any) {
    const user = await this.prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true, email: true, username: true, fullName: true,
        phone: true, address: true, avatarUrl: true, role: true,
        status: true, shopId: true, createdAt: true, lastLogin: true,
      },
    });
    return { profile: user };
  }

  @Patch()
  @ApiOperation({ summary: 'Update profil kasir (nama, HP, alamat)' })
  async updateProfile(@Request() req: any, @Body() dto: { fullName?: string; phone?: string; address?: string }) {
    const updated = await this.prisma.user.update({
      where: { id: req.user.id },
      data: {
        fullName: dto.fullName !== undefined ? dto.fullName : undefined,
        phone: dto.phone !== undefined ? dto.phone : undefined,
        address: dto.address !== undefined ? dto.address : undefined,
      },
      select: {
        id: true, email: true, username: true, fullName: true,
        phone: true, address: true, avatarUrl: true, role: true,
      },
    });
    return { success: true, profile: updated };
  }
}
