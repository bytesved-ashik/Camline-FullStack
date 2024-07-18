import { SystemConfig } from '@entities/systemConfig.entity';
import { Document, Model, PaginateModel } from 'mongoose';

type ISystemConfigDocument = Document & SystemConfig;

type ISystemConfigModel = Model<ISystemConfigDocument> &
  PaginateModel<ISystemConfigDocument>;

export { ISystemConfigDocument, ISystemConfigModel };
