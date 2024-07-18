import { Model, Document, PaginateModel } from 'mongoose';

import { Media } from '@entities/media.entity';

import { SoftDeleteModel } from 'mongoose-delete';

type IMediaDocument = Document & {
  isMediaofUser: (userId: string) => Promise<boolean>;
} & Media;

type IMediaModel = Model<IMediaDocument> &
  SoftDeleteModel<IMediaDocument> &
  PaginateModel<IMediaDocument>;

export { IMediaDocument, IMediaModel };
