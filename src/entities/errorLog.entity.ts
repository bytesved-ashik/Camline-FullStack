import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';

@Schema({
  timestamps: true,
})
export class ErrorLog {
  @Prop({ required: true })
  statusCode: number;

  @Prop({ required: true })
  message: string;

  @Prop({ required: true })
  path: string;

  @Prop({ required: true })
  error: string;

  @Prop({ required: true })
  errorDetails: string;
}

export const ErrorLogSchema = SchemaFactory.createForClass(ErrorLog);
