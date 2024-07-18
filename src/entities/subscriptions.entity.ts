import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types, Schema as MongooseSchema } from 'mongoose';
@Schema({
  timestamps: true,
})
export class Subscriptions {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  callInMinutes: number;

  @Prop({ required: true, ref: 'User', type: MongooseSchema.Types.ObjectId })
  userId: Types.ObjectId;
}

export const SubscriptionsSchema = SchemaFactory.createForClass(Subscriptions);
