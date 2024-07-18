import { Document, Model, PaginateModel } from 'mongoose';
import { Transaction } from '@entities/transaction.entity';

type ITransactionDocument = Document & Transaction;

type ITransactionModel = Model<ITransactionDocument> &
  PaginateModel<ITransactionDocument>;
export { ITransactionDocument, ITransactionModel };
