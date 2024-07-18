import { Token } from '@entities/token.entity';
import { Document, Model } from 'mongoose';
import { ITimeStampDocument } from '../IDocument.interface';

export interface ITokenMethods {
  isExpired(): Promise<boolean>;
}

type ITokenDocument = Document & Token & ITokenMethods & ITimeStampDocument;

type ITokenModel = Model<ITokenDocument>;

export { ITokenDocument, ITokenModel };
