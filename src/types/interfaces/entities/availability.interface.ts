import { Document, Model, PaginateModel } from 'mongoose';
import { Availability } from '@entities/availability.entity';

type IAvailabilityDocument = Document & Availability;

type IAvailabilityModel = Model<IAvailabilityDocument> &
  PaginateModel<IAvailabilityDocument>;

export { IAvailabilityDocument, IAvailabilityModel };
