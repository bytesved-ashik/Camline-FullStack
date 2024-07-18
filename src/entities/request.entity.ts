import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Schema as MongooseSchema, Types } from 'mongoose';
import { REQUEST_STATUS } from '@enums';

@Schema({
  timestamps: true,
})
export class SessionRequest {
  @Prop({ required: true, ref: 'User', type: MongooseSchema.Types.ObjectId })
  user: Types.ObjectId;

  @Prop({ required: false, ref: 'User', type: MongooseSchema.Types.ObjectId })
  therapist: Types.ObjectId;

  @Prop({
    required: true,
    type: [{ type: MongooseSchema.Types.ObjectId, ref: 'Category' }],
  })
  categories: Types.ObjectId[];

  @Prop({ required: true })
  query: string;

  @Prop({ required: true })
  requestType: string;

  @Prop({
    required: false,
    ref: 'Session',
    type: MongooseSchema.Types.ObjectId,
  })
  sessionId: Types.ObjectId;

  @Prop({
    required: true,
    enum: REQUEST_STATUS,
    default: REQUEST_STATUS.IN_POOL,
  })
  requestStatus: string;

  @Prop({ required: false, default: [] })
  acceptedBy: AcceptedBy[];

  @Prop({ required: false, default: Date.now })
  requestedAt: Date;

  @Prop({ required: false })
  tid: string;

  @Prop({
    required: false,
    type: [{ type: MongooseSchema.Types.ObjectId, ref: 'User' }],
    default: [],
  })
  rejectedBy: Types.ObjectId[];

  @Prop({
    required: false,
    type: [{ type: MongooseSchema.Types.ObjectId, ref: 'Media' }],
  })
  documents;

  @Prop({ required: false })
  color?: string;

  @Prop({ required: false })
  scheduleSessionDuration: number;

  @Prop({ required: false })
  scheduleStartDate: Date;

  @Prop({ required: false })
  scheduleEndDate: Date;
}

class AcceptedBy {
  @Prop({ required: true, ref: 'User', type: MongooseSchema.Types.ObjectId })
  user: Types.ObjectId;

  @Prop({ required: true })
  streamId: string;

  @Prop({ required: false, default: Date.now })
  acceptedAt: Date;
}

export const SessionRequestSchema =
  SchemaFactory.createForClass(SessionRequest);
