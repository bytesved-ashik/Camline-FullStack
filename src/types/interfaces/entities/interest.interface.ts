import { Interest } from '@entities/interest.entity';
import { Document, Model, PaginateModel } from 'mongoose';

export type IInterestDocument = Document & Interest;

export type IInterestModel = Model<IInterestDocument> &
  PaginateModel<IInterestDocument>;
