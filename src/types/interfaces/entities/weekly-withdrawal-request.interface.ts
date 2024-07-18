import { Document, Model } from 'mongoose';
import { WeeklyWithdrawalRequest } from '@entities/weekly-withdrawal-request.entity';

type IWeeklyWithdrawalRequestDocument = Document & WeeklyWithdrawalRequest;

type IWeeklyWithdrawalRequestModel = Model<IWeeklyWithdrawalRequestDocument>;
export { IWeeklyWithdrawalRequestDocument, IWeeklyWithdrawalRequestModel };
