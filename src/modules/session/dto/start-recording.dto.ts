import { IsString, IsNotEmpty } from 'class-validator';

export class StartRecordingDto {
  @IsString()
  @IsNotEmpty()
  streamId: string;

  @IsString()
  @IsNotEmpty()
  url: string;
}
