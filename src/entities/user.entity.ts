import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { GENDER, ROLE, USER_STATUS } from 'src/types/enums';

@Schema({
  timestamps: true,
  toJSON: {
    virtuals: true,
  },
})
export class User {
  @Prop({ required: true })
  firstName: string;

  @Prop({ required: true })
  lastName: string;

  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true, private: true })
  password: string;

  @Prop({ required: true, default: false })
  emailVerified: boolean;

  @Prop({
    required: true,
    type: [{ type: String, enum: ROLE }],
  })
  roles: ROLE[];

  @Prop({ required: true, default: USER_STATUS.PENDING, enum: USER_STATUS })
  status: USER_STATUS;

  @Prop({ required: false, default: false })
  isOnline: boolean;

  @Prop({ required: false })
  clientId: string;

  @Prop({ unique: true })
  referralCode: string;

  @Prop({ required: false, enum: GENDER })
  gender: GENDER;

  @Prop({ required: false })
  isTwoStepVerified: boolean;

  @Prop({ required: false })
  rejectReason: string;
}

export const UserSchema = SchemaFactory.createForClass(User);
