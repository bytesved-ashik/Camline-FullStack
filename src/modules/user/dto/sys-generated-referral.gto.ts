import { IsNotEmpty, IsNumber } from 'class-validator';

export class SysGeneratedReferralDto {
  @IsNumber()
  @IsNotEmpty()
  numOfRecords: number;
}
