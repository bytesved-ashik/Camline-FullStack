import { IsNotEmpty, IsString } from 'class-validator';

export class NewVerifyEmailDto {
  @IsString()
  @IsNotEmpty()
  token: string;
}
