import { Document, Model } from 'mongoose';
import { Notes } from '@entities/notes.entity';

type INotesDocument = Document & Notes;

type INotesModel = Model<INotesDocument>;
export { INotesDocument, INotesModel };
