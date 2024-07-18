import { IsValidObjectId } from '@decorators/valid-id.decorator';
import { IsOptional } from 'class-validator';

export class CloseAccountDto {
  @IsValidObjectId()
  @IsOptional()
  userId: string;
}
