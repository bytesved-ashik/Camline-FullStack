import { Document, Model } from 'mongoose';
import { UserProfile } from '@entities/user-profile.entity';

type IUserProfileDocument = Document & UserProfile;

type IUserProfileModel = Model<IUserProfileDocument>;
export { IUserProfileDocument, IUserProfileModel };
