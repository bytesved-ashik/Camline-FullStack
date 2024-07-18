import { IsValidObjectId } from '@decorators/valid-id.decorator';
import { IsOptional } from 'class-validator';

export class ResendVerificationEmailDto {
  @IsOptional()
  @IsValidObjectId()
  userId: string;
}
