import { Chat } from '@entities/chat.entity';
import { Document, Model } from 'mongoose';

type IChatDocument = Document & Chat;

type IChatModel = Model<IChatDocument>;
export { IChatDocument, IChatModel };
