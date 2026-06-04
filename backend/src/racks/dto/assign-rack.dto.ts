import { IsString, IsOptional } from 'class-validator';

export class AssignRackDto {
  /** Set to null or omit to unassign rack */
  @IsString()
  @IsOptional()
  rackId?: string | null;
}
