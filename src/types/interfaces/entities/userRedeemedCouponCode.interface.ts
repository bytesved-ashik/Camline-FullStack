import { Document, Model, PaginateModel } from 'mongoose';
import { UserRedeemedCouponCode } from '@entities/userReedemedCouponCode.entity';

type IUserRedeemedCouponCodeDocument = Document & UserRedeemedCouponCode;

type IUserRedeemedCouponCodeModel = Model<IUserRedeemedCouponCodeDocument> &
  PaginateModel<IUserRedeemedCouponCodeDocument>;

export { IUserRedeemedCouponCodeDocument, IUserRedeemedCouponCodeModel };
