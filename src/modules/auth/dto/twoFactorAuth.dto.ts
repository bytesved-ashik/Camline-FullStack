import { IsNotEmpty, IsString } from 'class-validator';

export class TwoFactorAuthDto {
  @IsNotEmpty()
  @IsString()
  token: string;
}
