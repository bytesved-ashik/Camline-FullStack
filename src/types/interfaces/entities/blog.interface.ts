import { Blog } from '@entities/blog.entity';
import { Document, Model, PaginateModel } from 'mongoose';

type IBlogDocument = Document & Blog;

type IBlogModel = Model<IBlogDocument> & PaginateModel<IBlogDocument>;
export { IBlogDocument, IBlogModel };
