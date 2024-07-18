import {
  SubscriptionPlan,
  SubscriptionPlanSchema,
} from '@entities/subscriptionPlan.entity';
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SubscriptionPlanController } from './subscriptionPlan.controller';
import { SubscriptionPlanService } from './subscriptionPlan.service';
import { SubscriptionPlanRepository } from '@repositories/subscriptionPlan.repository';
import * as paginate from 'mongoose-paginate-v2';
import toJSON from '@entities/plugins/toJSON.plugin';

@Module({
  imports: [
    MongooseModule.forFeatureAsync([
      {
        name: SubscriptionPlan.name,
        useFactory: () => {
          SubscriptionPlanSchema.plugin(paginate);
          SubscriptionPlanSchema.plugin(toJSON);
          return SubscriptionPlanSchema;
        },
      },
    ]),
  ],
  controllers: [SubscriptionPlanController],
  providers: [SubscriptionPlanService, SubscriptionPlanRepository],
  exports: [SubscriptionPlanService, SubscriptionPlanRepository],
})
export class SubscriptionPlanModule {}
