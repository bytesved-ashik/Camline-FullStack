import { IsValidObjectId } from '@decorators/valid-id.decorator';
import { IsNotEmpty, IsString } from 'class-validator';

export class PingDto {
  @IsString()
  @IsNotEmpty()
  @IsValidObjectId()
  session: string;
}
