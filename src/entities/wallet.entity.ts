import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types, Schema as MongooseSchema } from 'mongoose';
import toJSON from './plugins/toJSON.plugin';

@Schema({
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
})
export class Wallet {
  @Prop({ required: true })
  mainBalance: number;

  @Prop({ required: true })
  bonusBalance: number;

  @Prop({ required: true })
  holdedMainBalance: number;

  @Prop({ required: true })
  holdedBonusBalance: number;

  @Prop({ required: true, ref: 'User', type: MongooseSchema.Types.ObjectId })
  user: Types.ObjectId;

  @Prop({ required: false, default: 15 })
  freeTrialMinutes: number;

  @Prop({ required: false, default: 0 })
  holdedTrialMinutes: number;

  @Prop({ required: false, private: true })
  stripeCustomerId: string;

  @Prop({ required: false, default: 0 })
  availableVATCharge: number;

  @Prop({ required: true, default: 0 })
  withdrawalBalance: number;
}

export const WalletSchema = SchemaFactory.createForClass(Wallet);

WalletSchema.index({ user: 1 }, { unique: true });

/* WalletSchema.virtual('totalMainBalance').get(function () {
  return this.mainBalance + this.holdedMainBalance;
});

WalletSchema.virtual('totalBonusBalance').get(function () {
  return this.bonusBalance + this.holdedBonusBalance;
});

WalletSchema.virtual('totalTrialMinutes').get(function () {
  return this.freeTrialMinutes + this.holdedTrialMinutes;
}); */

WalletSchema.plugin(toJSON);
