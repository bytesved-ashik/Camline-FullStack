import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ROLE } from 'src/types/enums';
import toJSON from './plugins/toJSON.plugin';

@Schema({
  timestamps: true,
})
export class Interest {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  email: string;

  @Prop({ required: true, enum: [ROLE.THERAPIST, ROLE.USER] })
  role: ROLE;
}

export const InterestSchema = SchemaFactory.createForClass(Interest);

InterestSchema.index({ email: 1, role: 1 }, { unique: true });
InterestSchema.plugin(toJSON);
