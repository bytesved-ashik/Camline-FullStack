import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({
  timestamps: true,
})
export class SystemReferralCode {
  @Prop({ required: false })
  firstName: string;

  @Prop({ required: false })
  lastName: string;

  @Prop({ required: false })
  email: string;

  @Prop({ required: true, unique: true })
  referralCode: string;

  @Prop({ required: false })
  source: string;
}

export const SystemReferralCodeSchema =
  SchemaFactory.createForClass(SystemReferralCode);
