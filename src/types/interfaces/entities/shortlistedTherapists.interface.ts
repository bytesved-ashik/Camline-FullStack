import { Model, PaginateModel } from 'mongoose';
import { ShortlistedTherapists } from '@entities/shortlistedTherapist.entity';

type IShortlistedTherapistsDocument = Document & ShortlistedTherapists;

type IShortlistedTherapistsModel = Model<IShortlistedTherapistsDocument> &
  PaginateModel<IShortlistedTherapistsDocument>;

export { IShortlistedTherapistsDocument, IShortlistedTherapistsModel };
