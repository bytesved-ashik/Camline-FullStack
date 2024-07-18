import { Document, Model } from 'mongoose';
import { Question } from '@entities/question.entity';

type IQuestionDocument = Document & Question;

type IQuestionModel = Model<IQuestionDocument>;
export { IQuestionDocument, IQuestionModel };
