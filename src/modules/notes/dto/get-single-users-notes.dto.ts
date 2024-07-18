import { IsValidObjectId } from '@decorators/valid-id.decorator';
import { IsNotEmpty, IsString } from 'class-validator';

export class GetSingleUsersNotesDto {
  @IsString()
  @IsNotEmpty()
  @IsValidObjectId()
  userId: string;
}
