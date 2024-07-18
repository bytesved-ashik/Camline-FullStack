import { IsValidObjectId } from '@decorators/valid-id.decorator';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateShortlistTherapistDto {
  @IsNotEmpty()
  @IsString()
  @IsValidObjectId()
  therapistId;
}
