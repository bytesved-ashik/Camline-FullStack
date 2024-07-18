import { IsValidObjectId } from '@decorators/valid-id.decorator';
import { IsNotEmpty, IsString } from 'class-validator';

export class GetChatSessionIdDto {
  @IsNotEmpty()
  @IsString()
  @IsValidObjectId()
  receiverId;
}
