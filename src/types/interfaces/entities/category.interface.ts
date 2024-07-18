import { Document, Model, PaginateModel } from 'mongoose';
import { Category } from '@entities/category.entity';

type ICategoryDocument = Document & Category;

type ICategoryModel = Model<ICategoryDocument> &
  PaginateModel<ICategoryDocument>;
export { ICategoryDocument, ICategoryModel };
