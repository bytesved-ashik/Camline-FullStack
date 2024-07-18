import { IsNotEmpty, IsString } from 'class-validator';

export class CreateMediaDto {
  @IsString()
  @IsNotEmpty()
  filepath: string;

  @IsString()
  @IsNotEmpty()
  size: number;

  @IsString()
  @IsNotEmpty()
  mimetype: string;
}
