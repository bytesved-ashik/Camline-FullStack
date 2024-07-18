import { IsString, IsNotEmpty } from 'class-validator';

export class CreateTranscriptDto {
  @IsString()
  @IsNotEmpty()
  streamId: string;
}
