import { Message } from '@entities/message.entity';
import { Document, Model, PaginateModel } from 'mongoose';

type IMessageDocument = Document & Message;

type IMessageModel = Model<IMessageDocument> & PaginateModel<IMessageDocument>;
export { IMessageDocument, IMessageModel };
