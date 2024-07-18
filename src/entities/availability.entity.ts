import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types, Schema as MongooseSchema } from 'mongoose';
@Schema({
  timestamps: true,
})
export class Availability {
  @Prop({ required: true })
  is24HoursAvailable: boolean;

  @Prop({
    default: [],
    type: [
      {
        dayInString: { type: String },
        startDate: { type: String },
        endDate: { type: String },
      },
    ],
  })
  availability: string;

  @Prop({ required: true, ref: 'User', type: MongooseSchema.Types.ObjectId })
  userId: Types.ObjectId;
}

export const AvailabilitySchema = SchemaFactory.createForClass(Availability);
