import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class SubscriptionPlanDto {
  @IsString()
  @IsNotEmpty()
  subscriptionName: string;

  @IsString()
  @IsOptional()
  description: string;

  @IsNumber()
  @IsNotEmpty()
  numberOfSession: number;

  @IsNumber()
  @IsNotEmpty()
  hourlyCharge: number;

  @IsNumber()
  @IsNotEmpty()
  normalHourChargePrice: number;

  @IsNumber()
  @IsNotEmpty()
  sessionDurationMinutes: number;
}
