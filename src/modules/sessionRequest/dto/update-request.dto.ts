import { IsString, IsNotEmpty } from 'class-validator';

export class UpdateRequestDto {
  @IsString()
  @IsNotEmpty()
  query: string;
}
