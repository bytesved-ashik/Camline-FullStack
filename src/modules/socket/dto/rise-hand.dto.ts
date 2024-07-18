import { IsValidObjectId } from '@decorators/valid-id.decorator';
import { IsNotEmpty, IsString } from 'class-validator';

export class RiseHandDto {
  @IsString()
  @IsNotEmpty()
  @IsValidObjectId()
  sessionId: string;

  @IsString()
  @IsNotEmpty()
  @IsValidObjectId()
  userId: string;
}
