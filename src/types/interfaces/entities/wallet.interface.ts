import { Wallet } from '@entities/wallet.entity';
import { ClientSession, Document, Model } from 'mongoose';
export interface IWalletMethods {
  hasFreeMinutes(): Promise<boolean>;
  holdTrialMinute(session: ClientSession): Promise<IWalletDocument>;
  hasEnoughBalance(balance: number): Promise<boolean>;
  holdBalance(
    mainBalance: number,
    bonusBalance: number,
    session: ClientSession,
  ): Promise<IWalletDocument>;
}

type IWalletDocument = Document & Wallet & IWalletMethods;

type IWalletModel = Model<IWalletDocument>;
export { IWalletDocument, IWalletModel };

export interface DeductionData {
  deductAmount: number;
  remainingFreeTrialMinutes: number;
  usedFreeTrialMinutes: number;
  extraCharge: number;
  userReferToTherapist: boolean;
}
