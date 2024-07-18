import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types, Schema as MongooseSchema } from 'mongoose';

@Schema({
  timestamps: true,
})
export class UserProfile {
  @Prop({
    required: true,
    type: [{ type: MongooseSchema.Types.ObjectId, ref: 'Category' }],
  })
  categories: Types.ObjectId[];

  @Prop({ required: true, ref: 'User', type: MongooseSchema.Types.ObjectId })
  user: Types.ObjectId;

  @Prop({ required: false })
  phoneNumber: string;

  @Prop({ required: false })
  address: string;

  @Prop({ required: false, ref: 'Media', type: MongooseSchema.Types.ObjectId })
  profilePicture: Types.ObjectId;

  @Prop({ required: false })
  language: string;

  @Prop({ required: false })
  state: string;

  @Prop({ required: false })
  zipCode: string;

  @Prop({ required: false })
  country: string;

  @Prop({ required: false })
  currency: string;

  @Prop({ required: false })
  budget: number;

  @Prop({ required: false })
  questions: MongooseSchema.Types.Mixed[];

  @Prop({ required: false })
  bio: string;
}

export const UserProfileSchema = SchemaFactory.createForClass(UserProfile);
