import {
  IsBoolean,
  IsISO4217CurrencyCode,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
} from 'class-validator';

export class StripeClientSecretDto {
  @IsNumber()
  @IsPositive()
  amount: number;

  @IsOptional()
  @IsNotEmpty()
  @IsString()
  @IsISO4217CurrencyCode()
  currency = 'USD';

  @IsOptional()
  @IsNotEmpty()
  @IsBoolean()
  saveCard = false;

  @IsOptional()
  @IsString()
  couponCode: string;
}
