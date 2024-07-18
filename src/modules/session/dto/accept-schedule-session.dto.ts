import { IsString, IsNotEmpty } from 'class-validator';

export class AcceptScheduleSessionDto {
  @IsString()
  @IsNotEmpty()
  streamId: string;
}
