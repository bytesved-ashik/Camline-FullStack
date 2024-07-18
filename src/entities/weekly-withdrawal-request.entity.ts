import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types, Schema as MongooseSchema } from 'mongoose';
import { WITHDRAWAL_REQUEST_STATUS } from 'src/types/enums/withdrawal-request.enum';

@Schema({
  timestamps: true,
})
export class WeeklyWithdrawalRequest {
  @Prop({ required: true, ref: 'User', type: MongooseSchema.Types.ObjectId })
  therapist: Types.ObjectId;

  @Prop({ required: true })
  amount: number;

  @Prop({
    required: true,
    enum: WITHDRAWAL_REQUEST_STATUS,
    default: WITHDRAWAL_REQUEST_STATUS.PENDING,
  })
  status: WITHDRAWAL_REQUEST_STATUS;

  @Prop({ required: true })
  startDate: Date;

  @Prop({ required: true })
  endDate: Date;
}

export const WeeklyWithdrawalRequestSchema = SchemaFactory.createForClass(
  WeeklyWithdrawalRequest,
);
