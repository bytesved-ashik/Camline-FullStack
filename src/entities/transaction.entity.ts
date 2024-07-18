import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types, Schema as MongooseSchema } from 'mongoose';
import { TRANSACTION_STATUS, TRANSACTION_TYPE } from 'src/types/enums';

@Schema({
  timestamps: true,
})
export class Transaction {
  @Prop({ required: true })
  type: TRANSACTION_TYPE;

  @Prop({ required: true })
  amount: number;

  @Prop({ required: false, default: 0 })
  holdedMainBalance: number;

  @Prop({ required: false, default: 0 })
  holdedBonusBalance: number;

  @Prop({ required: false, default: 0 })
  holdedTrialMinutes: number;

  @Prop({ required: false })
  tid: string;

  @Prop({ required: false, ref: 'User', type: MongooseSchema.Types.ObjectId })
  user: Types.ObjectId;

  @Prop({ required: false, ref: 'User', type: MongooseSchema.Types.ObjectId })
  therapist: Types.ObjectId;

  @Prop({ required: true })
  remarks: string;

  @Prop({
    required: true,
    enum: TRANSACTION_STATUS,
    default: TRANSACTION_STATUS.PENDING,
  })
  status: TRANSACTION_STATUS;

  @Prop({ required: false, default: 0 })
  therapistAmount: number;

  @Prop({ required: false, default: 0 })
  commissionAmount: number;

  @Prop({ required: false, default: 0 })
  usedFreeTrialMinutes: number;

  @Prop({ required: false })
  VATCharge: number;

  @Prop({ required: false })
  therapistVATCharge: number;

  @Prop({ required: false })
  platformVATCharge: number;

  @Prop({
    required: false,
    ref: 'UserRedeemedCouponCode',
    type: MongooseSchema.Types.ObjectId,
  })
  userRedeemedCouponCodeId: Types.ObjectId;

  @Prop({ required: false, default: 0 })
  extraCharge: number;
}

export const TransactionSchema = SchemaFactory.createForClass(Transaction);
