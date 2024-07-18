import { IsString, IsNotEmpty } from 'class-validator';

export class AcceptRequestDto {
  @IsString()
  @IsNotEmpty()
  streamId: string;
}
