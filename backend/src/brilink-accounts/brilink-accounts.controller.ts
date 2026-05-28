import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { BrilinkAccountsService } from './brilink-accounts.service';
import {
  CreateBrilinkAccountDto,
  UpdateBrilinkAccountDto,
  MutationActionDto,
  QueryMutationsDto,
} from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('BRILink Accounts')
@Controller('api/brilink-accounts')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class BrilinkAccountsController {
  constructor(private readonly service: BrilinkAccountsService) {}

  @Get()
  @ApiOperation({ summary: 'List all active brilink accounts for a shop' })
  async findAll(@Query('shopId') shopId: string) {
    return this.service.findAll(shopId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get single brilink account' })
  async findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new brilink account' })
  async create(@Body() dto: CreateBrilinkAccountDto) {
    return this.service.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update brilink account' })
  async update(@Param('id') id: string, @Body() dto: UpdateBrilinkAccountDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft delete brilink account (set isActive=false)' })
  async remove(@Param('id') id: string) {
    return this.service.remove(id);
  }

  @Post(':id/setor')
  @ApiOperation({ summary: 'Setor saldo ke rekening BRI agen' })
  async setor(
    @Param('id') id: string,
    @Body() dto: MutationActionDto,
    @Req() req: any,
  ) {
    const userId = req.user?.id || req.user?.sub;
    return this.service.setor(id, dto, userId);
  }

  @Post(':id/tarik')
  @ApiOperation({ summary: 'Tarik saldo dari rekening BRI agen' })
  async tarik(
    @Param('id') id: string,
    @Body() dto: MutationActionDto,
    @Req() req: any,
  ) {
    const userId = req.user?.id || req.user?.sub;
    return this.service.tarik(id, dto, userId);
  }

  @Get(':id/mutations')
  @ApiOperation({ summary: 'Get paginated mutation history for an account' })
  async getMutations(
    @Param('id') id: string,
    @Query() query: QueryMutationsDto,
  ) {
    return this.service.getMutations(id, query.page || 1, query.limit || 20);
  }
}
