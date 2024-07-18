import { IsNotEmpty, IsString } from 'class-validator';

export class PurchaseSubscriptionDto {
  @IsString()
  @IsNotEmpty()
  subscriptionPlanId: string;
}
