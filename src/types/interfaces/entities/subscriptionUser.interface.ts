import { SubscriptionUser } from '@entities/subscriptionUser.entity';
import { Document, Model, PaginateModel } from 'mongoose';

type ISubscriptionUserDocument = Document & SubscriptionUser;

type ISubscriptionUserModel = Model<ISubscriptionUserDocument> &
  PaginateModel<ISubscriptionUserDocument>;
export { ISubscriptionUserDocument, ISubscriptionUserModel };
