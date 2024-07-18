import { ErrorLog } from '@entities/errorLog.entity';
import { Document, Model } from 'mongoose';

type IErrorLogDocument = Document & ErrorLog;

type IErrorLogModel = Model<IErrorLogDocument>;
export { IErrorLogDocument, IErrorLogModel };
