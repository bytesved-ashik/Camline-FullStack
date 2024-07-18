import { Document, Model } from 'mongoose';
import { Referral } from '@entities/user-referral.entity';

type IReferralDocument = Document & Referral;

type IReferralModel = Model<IReferralDocument>;
export { IReferralDocument, IReferralModel };
