import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types, Schema as MongooseSchema } from 'mongoose';

@Schema({
  timestamps: true,
})
export class Chat {
  @Prop({
    required: true,
    type: [{ type: MongooseSchema.Types.ObjectId, ref: 'User' }],
  })
  users: Types.ObjectId[];

  @Prop({
    required: true,
    ref: 'Session',
    type: MongooseSchema.Types.ObjectId,
  })
  chatSessionId: Types.ObjectId;
}

export const ChatSchema = SchemaFactory.createForClass(Chat);
