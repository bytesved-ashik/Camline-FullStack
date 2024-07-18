import { Document, Model, PaginateModel } from 'mongoose';
import { SystemReferralCode } from '@entities/systemReferralCode.entity';

type ISystemReferralCodeDocument = Document & SystemReferralCode;

type ISystemReferralCodeModel = Model<ISystemReferralCodeDocument> &
  PaginateModel<ISystemReferralCodeDocument>;

export { ISystemReferralCodeDocument, ISystemReferralCodeModel };
