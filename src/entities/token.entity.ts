import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types, Schema as MongooseSchema } from 'mongoose';
import { ROLE, TOKEN_TYPE } from '@enums';

@Schema({
  timestamps: true,
})
export class Token {
  @Prop({ required: true, ref: 'User', type: MongooseSchema.Types.ObjectId })
  userId: Types.ObjectId;

  @Prop({ required: true })
  token: string;

  @Prop({ required: true, enum: TOKEN_TYPE })
  tokenType: string;

  @Prop({
    required: false,
    type: Object,
  })
  extraData?: {
    VATnumber?: string;
    roles: ROLE[];
  };

  @Prop()
  createdAt: Date;

  @Prop()
  updatedAt: Date;
}

export const TokenSchema = SchemaFactory.createForClass(Token);
