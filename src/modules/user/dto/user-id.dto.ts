import { IsString, IsNotEmpty } from 'class-validator';
import { IsValidObjectId } from '@decorators/valid-id.decorator';

export class UserIdDto {
  @IsString()
  @IsNotEmpty()
  @IsValidObjectId()
  userId: string;
}
