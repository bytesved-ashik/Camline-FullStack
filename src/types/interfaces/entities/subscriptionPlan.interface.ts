import { SubscriptionPlan } from '@entities/subscriptionPlan.entity';
import { Document, Model, PaginateModel } from 'mongoose';

type ISubscriptionPlanDocument = Document & SubscriptionPlan;

type ISubscriptionPlanModel = Model<ISubscriptionPlanDocument> &
  PaginateModel<ISubscriptionPlanDocument>;
export { ISubscriptionPlanDocument, ISubscriptionPlanModel };
