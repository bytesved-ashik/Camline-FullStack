import { IsNotEmpty, IsString } from 'class-validator';
import { SubscriptionPlanDto } from './createSubscriptionPlan.dto';
import { IsValidObjectId } from '@decorators/valid-id.decorator';

export class UpdateSubscriptionPlanDto extends SubscriptionPlanDto {
  @IsString()
  @IsNotEmpty()
  @IsValidObjectId()
  subscriptionPlanId: string;
}
