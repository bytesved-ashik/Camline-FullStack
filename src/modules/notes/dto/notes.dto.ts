import { IsValidObjectId } from '@decorators/valid-id.decorator';
import { IsNotEmpty, IsString } from 'class-validator';

export class NotesDto {
  @IsString()
  @IsNotEmpty()
  @IsValidObjectId()
  userId: string;

  @IsString()
  @IsNotEmpty()
  notes: string;

  @IsString()
  @IsNotEmpty()
  @IsValidObjectId()
  sessionId: string;
}
