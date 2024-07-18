import { IsValidObjectId } from '@decorators/valid-id.decorator';
import { IsString, IsEnum } from 'class-validator';
import { REQUEST_STATUS } from 'src/types/enums';

export class UpdateRequestSessionDto {
  @IsString()
  @IsEnum(REQUEST_STATUS)
  requestStatus: REQUEST_STATUS;

  @IsValidObjectId()
  @IsString()
  session: string;
}
