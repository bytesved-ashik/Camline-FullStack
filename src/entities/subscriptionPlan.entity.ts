import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({
  timestamps: true,
})
export class SubscriptionPlan {
  @Prop({ required: true })
  subscriptionName: string;

  @Prop({ required: true })
  description: string;

  @Prop({ required: true })
  subscriptionPrice: number;

  @Prop({ required: true })
  numberOfSession: number;

  @Prop({ required: true })
  hourlyCharge: number;

  @Prop({ required: true })
  perMinuteCharge: number;

  @Prop({ required: true })
  VATCharge: number;

  @Prop({ required: true })
  normalHourChargePrice: number;

  @Prop({ required: true })
  sessionDurationMinutes: number;
}

export const SubscriptionPlanSchema =
  SchemaFactory.createForClass(SubscriptionPlan);
