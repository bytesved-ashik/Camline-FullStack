import { Document, Model, PaginateModel } from 'mongoose';
import { CallHistory } from '@entities/call-history.entity';

type ICallHistoryDocument = Document & CallHistory;

type ICallHisotryModel = Model<ICallHistoryDocument> &
  PaginateModel<ICallHistoryDocument>;

export { ICallHistoryDocument, ICallHisotryModel };
