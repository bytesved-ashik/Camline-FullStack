import { IsValidObjectId } from '@decorators/valid-id.decorator';
import { IsNotEmpty, IsString } from 'class-validator';

export class TherapistRejectDto {
  @IsValidObjectId()
  @IsNotEmpty()
  therapistId: string;

  @IsNotEmpty()
  @IsString()
  rejectReason: string;
}
