import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ROLE } from '@enums';

@Schema({
  timestamps: true,
})
export class Question {
  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  answers: string[];

  @Prop({
    required: true,
    enum: ROLE,
    default: ROLE.USER,
  })
  role: string;

  @Prop({ required: true })
  showOrder: number;
}

export const QuestionSchema = SchemaFactory.createForClass(Question);
