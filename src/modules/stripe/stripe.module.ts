import { WalletModule } from '@modules/wallet/wallet.module';
import { forwardRef, Module } from '@nestjs/common';
import { StripeController } from './stripe.controller';
import { StripeProvider } from './stripe.provider';
import { StripeService } from './stripe.service';
import { MongooseModule } from '@nestjs/mongoose';
import {
  SubscriptionPlan,
  SubscriptionPlanSchema,
} from '@entities/subscriptionPlan.entity';
import {
  SubscriptionUser,
  SubscriptionUserSchema,
} from '@entities/subscriptionUser.entity';
import {
  UserRedeemedCouponCode,
  UserRedeemedCouponCodeSchema,
} from '@entities/userReedemedCouponCode.entity';

@Module({
  imports: [
    MongooseModule.forFeatureAsync([
      {
        name: SubscriptionPlan.name,
        useFactory: () => {
          return SubscriptionPlanSchema;
        },
      },
      {
        name: SubscriptionUser.name,
        useFactory: () => {
          return SubscriptionUserSchema;
        },
      },
      {
        name: UserRedeemedCouponCode.name,
        useFactory: () => {
          return UserRedeemedCouponCodeSchema;
        },
      },
    ]),
    forwardRef(() => WalletModule),
  ],
  controllers: [StripeController],
  providers: [StripeService, StripeProvider],
})
export class StripeModule {}
