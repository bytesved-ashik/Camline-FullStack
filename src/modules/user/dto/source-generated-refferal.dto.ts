import { IsNotEmpty, IsString } from 'class-validator';

export class SourceGeneratedReferralDto {
  @IsString()
  @IsNotEmpty()
  source: string;

  @IsString()
  @IsNotEmpty()
  referralCode: string;
}
