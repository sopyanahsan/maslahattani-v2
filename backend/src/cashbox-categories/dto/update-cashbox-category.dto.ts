import { PartialType, OmitType } from '@nestjs/swagger';
import { CreateCashBoxCategoryDto } from './create-cashbox-category.dto';

/**
 * Update DTO. `code` tidak boleh diubah setelah create karena dipakai
 * sebagai stable identifier (mis: di reporting & audit log).
 */
export class UpdateCashBoxCategoryDto extends PartialType(
  OmitType(CreateCashBoxCategoryDto, ['code'] as const),
) {}
