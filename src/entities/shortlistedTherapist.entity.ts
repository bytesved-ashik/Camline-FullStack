import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Schema as MongooseSchema } from 'mongoose';

@Schema({
  timestamps: true,
})
export class ShortlistedTherapists {
  @Prop({ required: true, type: MongooseSchema.Types.ObjectId, ref: 'User' })
  userId;

  @Prop({ required: true, type: MongooseSchema.Types.ObjectId, ref: 'User' })
  therapistId;
}

export const ShortlistedTherapistsSchema = SchemaFactory.createForClass(
  ShortlistedTherapists,
);
