import { Document, Model, PaginateModel } from 'mongoose';
import { SessionRequest } from '@entities/request.entity';

type ISessionRequestDocument = Document & SessionRequest;

type ISessionRequestModel = Model<ISessionRequestDocument> &
  PaginateModel<ISessionRequestDocument>;
export { ISessionRequestDocument, ISessionRequestModel };
