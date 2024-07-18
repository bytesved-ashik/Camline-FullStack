import { Document, Model, PaginateModel } from 'mongoose';
import { TwoFactorAuth } from '@entities/twoFactorAuth.entity';

type ITwoFactorAuthDocument = Document & TwoFactorAuth;

type ITwoFactorAuthModel = Model<ITwoFactorAuthDocument> &
  PaginateModel<ITwoFactorAuthDocument>;
export { ITwoFactorAuthDocument, ITwoFactorAuthModel };
