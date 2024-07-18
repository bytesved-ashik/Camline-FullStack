import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types, Schema as MongooseSchema } from 'mongoose';
import { MEDIA_TYPE } from 'src/types/enums';

@Schema({ _id: false })
class MediaType {
  @Prop({
    required: false,
    enum: MEDIA_TYPE,
  })
  type: string;

  @Prop({
    required: false,
    type: [{ type: MongooseSchema.Types.ObjectId, ref: 'Media' }],
  })
  mediaId: Types.ObjectId[];
}

const MediaTypeSchema = SchemaFactory.createForClass(MediaType);

@Schema({ _id: false })
export class QuestionType {
  @Prop({
    required: false,
  })
  answers: string[];

  @Prop({
    required: false,
  })
  question: string;
}

const QuestionTypeSchema = SchemaFactory.createForClass(QuestionType);

@Schema({
  timestamps: true,
})
export class TherapistProfile {
  @Prop({
    required: true,
    type: [{ type: MongooseSchema.Types.ObjectId, ref: 'Category' }],
  })
  categories: Types.ObjectId[];

  @Prop({ required: true, ref: 'User', type: MongooseSchema.Types.ObjectId })
  user: Types.ObjectId;

  @Prop({ required: false, ref: 'Media', type: MongooseSchema.Types.ObjectId })
  profilePicture: Types.ObjectId;

  @Prop({ required: false })
  bio: string;

  @Prop({ required: false })
  perSessionPrice: number;

  @Prop({ required: false })
  phoneNumber: string;

  @Prop({ required: false })
  address: string;

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

  @Prop({ required: false, type: [QuestionTypeSchema] })
  questions: QuestionType[];

  @Prop({ required: false, private: true })
  deductionPercentage: string;

  @Prop({ required: false, type: [MediaTypeSchema] })
  medias: MediaType[];

  @Prop({ required: false })
  perHourCharge: number;

  @Prop({ required: false })
  VATNumber: string;
}

export const TherapistProfileSchema =
  SchemaFactory.createForClass(TherapistProfile);
