import { Settings } from '@entities/settings.entity';
import { Document, Model, PaginateModel } from 'mongoose';

type ISettingsDocument = Document & Settings;

type ISettingsModel = Model<ISettingsDocument> &
  PaginateModel<ISettingsDocument>;
export { ISettingsDocument, ISettingsModel };
