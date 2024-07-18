import { Document, Model } from 'mongoose';
import { TherapistProfile } from '@entities/therapist-profile.entity';

export interface ITherapistMethods {
  getDeductionPercentage(): number;
}

type ITherapistProfileDocument = Document &
  TherapistProfile &
  ITherapistMethods;

type ITherapistProfileModel = Model<ITherapistProfileDocument>;
export { ITherapistProfileDocument, ITherapistProfileModel };
