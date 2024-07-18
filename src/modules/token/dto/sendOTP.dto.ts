import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class SendOTPDto {
  @IsString()
  @IsEmail()
  @IsNotEmpty()
  email: string;
}
