import {
  Controller,
  Get,
  Put,
  Post,
  Body,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard, Roles } from '../auth/guards/roles.guard';
import { PermissionsService } from './permissions.service';
import { SkipSubscription } from '../subscription/skip-subscription.decorator';
import { Role } from '@prisma/client';
import { PERMISSION_GROUPS } from './permissions.constants';

@ApiTags('Permissions / RBAC')
@Controller('api/permissions')
@UseGuards(JwtAuthGuard)
@SkipSubscription()
@ApiBearerAuth()
export class PermissionsController {
  constructor(private readonly permissionsService: PermissionsService) {}

  /**
   * GET /api/permissions/me — Get current user's permissions.
   * Used by frontend to determine what to show/hide.
   */
  @Get('me')
  @ApiOperation({ summary: 'Get permissions for current user role' })
  async getMyPermissions(@Req() req: any) {
    const role = req.user.role as Role;
    const permissions = await this.permissionsService.getPermissionsForRole(role);
    return { role, permissions };
  }

  /**
   * GET /api/permissions/role?role=ADMIN — Get permissions for a specific role.
   * Super Admin only.
   */
  @Get('role')
  @UseGuards(RolesGuard)
  @Roles(Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get permissions for a specific role (Super Admin only)' })
  async getRolePermissions(@Query('role') role: string) {
    const permissions = await this.permissionsService.getPermissionsForRole(role as Role);
    return { role, permissions };
  }

  /**
   * GET /api/permissions/groups — Get all permission groups (for UI rendering).
   * Super Admin only.
   */
  @Get('groups')
  @UseGuards(RolesGuard)
  @Roles(Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get permission groups structure for UI' })
  async getPermissionGroups() {
    return { groups: PERMISSION_GROUPS };
  }

  /**
   * PUT /api/permissions/role — Bulk update permissions for a role.
   * Super Admin only.
   */
  @Put('role')
  @UseGuards(RolesGuard)
  @Roles(Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Update permissions for a role (Super Admin only)' })
  async updateRolePermissions(
    @Body() body: { role: string; permissions: Array<{ permission: string; enabled: boolean }> },
  ) {
    return this.permissionsService.bulkUpdatePermissions(
      body.role as Role,
      body.permissions,
    );
  }

  /**
   * POST /api/permissions/seed — Seed default permissions.
   * Super Admin only. Safe to call multiple times.
   */
  @Post('seed')
  @UseGuards(RolesGuard)
  @Roles(Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Seed default permissions (idempotent)' })
  async seedDefaults() {
    return this.permissionsService.seedDefaults();
  }
}
