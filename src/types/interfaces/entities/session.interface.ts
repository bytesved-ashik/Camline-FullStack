import { Document, Model, PaginateModel } from 'mongoose';
import { Session } from '@entities/session.entity';

type ISessionDocument = Document & Session;

type ISessionModel = Model<ISessionDocument> & PaginateModel<ISessionDocument>;
export { ISessionDocument, ISessionModel };
