import { Transaction } from '@entities/transaction.entity';
import { Wallet } from '@entities/wallet.entity';
import {
  NOTIFICATION_TYPE,
  SESSION_STATUS,
  SESSION_TYPE,
  TRANSACTION_STATUS,
  TRANSACTION_TYPE,
} from '@enums';
import {
  DeductionData,
  ISessionDocument,
  ISessionModel,
  IWalletDocument,
  IWalletModel,
} from '@interfaces';
import { ITransactionDocument, ITransactionModel } from '@interfaces';
import { BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import {
  ClientSession,
  FilterQuery,
  PaginateOptions,
  PaginateResult,
  Types,
} from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { UserRepository } from './user.repository';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { SESSION_CONSTANT } from '@constants/index';
import { Session } from '@entities/session.entity';
import { events } from '@events';
import { WeeklyWithdrawalRequest } from '@entities/weekly-withdrawal-request.entity';
import { IWeeklyWithdrawalRequestModel } from 'src/types/interfaces/entities/weekly-withdrawal-request.interface';
import * as moment from 'moment';
import { SocketGateway } from '@modules/socket/socket.gateway';
import { SystemConfigRepository } from './systemConfig.repository';

export class WalletRepository {
  constructor(
    @InjectModel(Wallet.name) private readonly walletModel: IWalletModel,
    @InjectModel(Transaction.name)
    private readonly transactionModel: ITransactionModel,
    private readonly userRepository: UserRepository,
    private readonly eventEmitter: EventEmitter2,
    @InjectModel(Session.name) private readonly sessionModel: ISessionModel,
    @InjectModel(WeeklyWithdrawalRequest.name)
    private readonly WeeklyWithdrawalRequestModel: IWeeklyWithdrawalRequestModel,
    private readonly socketGateway: SocketGateway,
    private readonly systemConfigRepository: SystemConfigRepository,
  ) {}

  async getWalletBalance(userId: string) {
    const wallet = await this.walletModel.findOne({
      user: new Types.ObjectId(userId),
    });
    return wallet;
  }

  async commitTransactionOld(
    user: string,
    therapist: string,
    tid: string,
    duration: number,
    session: ClientSession,
  ) {
    const userWallet = await this.getWalletBalance(user);
    const therapistWallet = await this.getWalletBalance(therapist);
    const transaction = await this.getTransaction(tid);

    const deductionPercentage = SESSION_CONSTANT.COMMISSITION_PERCENTAGE;
    userWallet.holdedTrialMinutes -= transaction.holdedTrialMinutes;
    userWallet.holdedBonusBalance -= transaction.holdedBonusBalance;
    userWallet.holdedMainBalance -= transaction.holdedMainBalance;

    // const callMinutes = Number((duration / 60).toFixed(2));
    // const { deductAmount, remainingFreeTrialMinutes } = await this.getDeduction(
    //   user,
    //   callMinutes,
    // );
    // userWallet.freeTrialMinutes = remainingFreeTrialMinutes;
    // userWallet.mainBalance -= deductAmount;

    const balance =
      transaction.holdedMainBalance + transaction.holdedBonusBalance;
    const deduction = (balance / 100) * deductionPercentage;
    const therapistAmount = balance - deduction;
    const commissionAmount = balance - therapistAmount;
    therapistWallet.mainBalance += therapistAmount;
    transaction.status = TRANSACTION_STATUS.SUCCESS;
    transaction.therapist = new Types.ObjectId(therapist);

    await this.createTransaction(
      {
        user,
        therapist,
        amount: deduction,
        tid: null,
        type: TRANSACTION_TYPE.COMMISSION_DEDUCTION,
        status: TRANSACTION_STATUS.SUCCESS,
        remarks: 'Commission deduction',
        therapistAmount,
        commissionAmount,
      },
      session,
    );

    await userWallet.save({ session });
    await therapistWallet.save({ session });
    await transaction.save({ session });
    return transaction;
  }

  async commitTransaction(
    user: string,
    sessionCall: ISessionDocument,
    session: ClientSession,
  ) {
    const therapist = sessionCall.therapist.toHexString();
    const duration = sessionCall.duration;
    let platformVATCharge = 0;
    let therapistVATCharge = 0;
    let totalTherapistAmount = 0;

    const userWallet = await this.getWalletBalance(user);
    const therapistWallet = await this.getWalletBalance(therapist);
    const therapistProfile = await this.userRepository.getTherapistProfile(
      therapist,
    );

    const deductionPercentage = SESSION_CONSTANT.COMMISSITION_PERCENTAGE;
    const VATDeductionPercentage = SESSION_CONSTANT.VAT_CHARGE_PERCENTAGE;

    const callMinutes = Number(duration / 60);
    const {
      deductAmount,
      remainingFreeTrialMinutes,
      usedFreeTrialMinutes,
      extraCharge,
      userReferToTherapist,
    } = await this.getDeduction(user, callMinutes, therapist);
    userWallet.freeTrialMinutes = remainingFreeTrialMinutes;

    let totalDeductAmount = deductAmount;
    let therapistAmount = 0;
    let deduction = 0;
    let commissionAmount = 0;

    const VATCharge = (deductAmount / 100) * VATDeductionPercentage;
    platformVATCharge = VATCharge;

    if (userReferToTherapist) {
      totalDeductAmount = deductAmount + extraCharge;
      therapistAmount = deductAmount;
      totalTherapistAmount = deductAmount;
      commissionAmount = extraCharge;
    } else {
      if (therapistProfile.VATNumber) {
        therapistVATCharge = (VATCharge / 100) * 50;
        platformVATCharge = (VATCharge / 100) * 50;
        totalTherapistAmount += therapistVATCharge;
      }

      deduction = (deductAmount / 100) * deductionPercentage;
      therapistAmount = Number(deductAmount - deduction);
      totalTherapistAmount += therapistAmount;

      commissionAmount = Number(deductAmount - therapistAmount);
    }

    userWallet.mainBalance -= totalDeductAmount;
    therapistWallet.mainBalance += totalTherapistAmount;

    const userCurrentAvailableVATCharge = userWallet.availableVATCharge;
    if (userCurrentAvailableVATCharge && VATCharge > 0) {
      userWallet.availableVATCharge -= VATCharge;
    }

    const commissionTransaction = await this.createTransaction(
      {
        user,
        therapist,
        amount: totalDeductAmount,
        tid: null,
        type: TRANSACTION_TYPE.COMMISSION_DEDUCTION,
        status: TRANSACTION_STATUS.SUCCESS,
        remarks: 'Commission deduction',
        therapistAmount,
        commissionAmount,
        usedFreeTrialMinutes,
        VATCharge,
        therapistVATCharge,
        platformVATCharge,
        extraCharge,
      },
      session,
    );

    await userWallet.save({ session });
    await therapistWallet.save({ session });
    return commissionTransaction;
  }

  async commitTransactionOnScheduledRequestAccepted(
    userId: string,
    therapistId: string,
    callMinutes: number,
    session: ClientSession,
  ) {
    const therapist = therapistId;
    // const duration = 10;
    let platformVATCharge = 0;
    let therapistVATCharge = 0;
    let totalTherapistAmount = 0;

    const userWallet = await this.getWalletBalance(userId);

    const therapistProfile = await this.userRepository.getTherapistProfile(
      therapist,
    );

    const deductionPercentage = SESSION_CONSTANT.COMMISSITION_PERCENTAGE;
    const VATDeductionPercentage = SESSION_CONSTANT.VAT_CHARGE_PERCENTAGE;

    const {
      deductAmount,
      remainingFreeTrialMinutes,
      usedFreeTrialMinutes,
      extraCharge,
      userReferToTherapist,
    } = await this.getDeduction(userId, callMinutes, therapist);
    userWallet.freeTrialMinutes = remainingFreeTrialMinutes;

    let totalDeductAmount = deductAmount;
    let therapistAmount = 0;
    let deduction = 0;
    let commissionAmount = 0;

    const VATCharge = (deductAmount / 100) * VATDeductionPercentage;
    platformVATCharge = VATCharge;

    if (userReferToTherapist) {
      totalDeductAmount = deductAmount + extraCharge;
      therapistAmount = deductAmount;
      totalTherapistAmount = deductAmount;
      commissionAmount = extraCharge;
    } else {
      if (therapistProfile.VATNumber) {
        therapistVATCharge = (VATCharge / 100) * 50;
        platformVATCharge = (VATCharge / 100) * 50;
        totalTherapistAmount += therapistVATCharge;
      }

      deduction = (deductAmount / 100) * deductionPercentage;
      therapistAmount = Number(deductAmount - deduction);
      totalTherapistAmount += therapistAmount;

      commissionAmount = Number(deductAmount - therapistAmount);
    }

    userWallet.mainBalance -= totalDeductAmount;

    const userCurrentAvailableVATCharge = userWallet.availableVATCharge;
    if (userCurrentAvailableVATCharge && VATCharge > 0) {
      userWallet.availableVATCharge -= VATCharge;
    }

    const commissionTransaction = await this.createTransaction(
      {
        user: userId,
        therapist,
        amount: totalDeductAmount,
        tid: null,
        type: TRANSACTION_TYPE.HOLD_REQUEST,
        status: TRANSACTION_STATUS.PENDING,
        remarks: 'Hold balance for schedule request session',
        therapistAmount,
        commissionAmount,
        usedFreeTrialMinutes,
        VATCharge,
        therapistVATCharge,
        platformVATCharge,
        extraCharge,
      },
      session,
    );

    await userWallet.save({ session });
    return commissionTransaction;
  }

  async getDeductionPercentage(therapist: string) {
    const therapistProfile = await this.userRepository.getTherapistProfile(
      therapist,
    );
    return therapistProfile.getDeductionPercentage();
  }

  async holdBalanceForRequest(
    userId: string,
    holdBalance: number,
    mongoSession: ClientSession,
  ): Promise<ITransactionDocument> {
    const hasTopUpTransaction = await this.hasTopUpTransaction(userId);
    if (!hasTopUpTransaction) {
      throw new BadRequestException("Don't have a top-up transaction");
    }
    const wallet = await this.getWalletBalance(userId);
    const hasFreeBalance = await wallet.hasFreeMinutes();

    if (hasFreeBalance) {
      await wallet.holdTrialMinute(mongoSession);
      const transaction = await this.createHoldTransaction(
        userId,
        0,
        0,
        1,
        mongoSession,
      );
      return transaction;
    }

    const hasEnoughBalance = await wallet.hasEnoughBalance(holdBalance);

    if (!hasEnoughBalance) {
      throw new BadRequestException('Insufficient funds');
    }

    let holdedFromMain = 0;
    let holdedFromBonus = 0;

    if (wallet.bonusBalance > holdBalance) {
      holdedFromBonus = holdBalance;
    } else {
      holdedFromBonus = wallet.bonusBalance;
      holdedFromMain = holdBalance - holdedFromBonus;
    }

    const transaction = await this.createHoldTransaction(
      userId,
      holdedFromMain,
      holdedFromBonus,
      0,
      mongoSession,
    );
    await wallet.holdBalance(holdedFromMain, holdedFromBonus, mongoSession);
    return transaction;
  }

  async hasTopUpTransaction(userId: string) {
    const transaction = await this.transactionModel.findOne({
      user: userId,
      type: TRANSACTION_TYPE.TOPUP,
      status: TRANSACTION_STATUS.SUCCESS,
    });

    if (!transaction) {
      return false;
    }

    return true;
  }

  async createHoldTransaction(
    userId: string,
    mainHolded: number,
    bonusHolded: number,
    trialHolded = 0,
    mongoSession: ClientSession,
  ): Promise<ITransactionDocument> {
    const type = TRANSACTION_TYPE.HOLD_REQUEST;
    const status = TRANSACTION_STATUS.PENDING;
    const description = 'Hold balance for request session';

    let therapistAmount = 0;
    let commissionAmount = 0;
    const amount = mainHolded + bonusHolded;

    if (amount > 0) {
      const deductionPercentage = SESSION_CONSTANT.COMMISSITION_PERCENTAGE;
      const deduction = (amount / 100) * deductionPercentage;
      therapistAmount = Number((amount - deduction).toFixed(2));
      commissionAmount = Number((amount - therapistAmount).toFixed(2));
    }

    return await this.createTransaction(
      {
        user: userId,
        therapist: null,
        amount: mainHolded + bonusHolded,
        tid: null,
        type,
        status,
        remarks: description,
        holdedMainBalance: mainHolded,
        holdedBonusBalance: bonusHolded,
        holdedTrialMinutes: trialHolded,
        therapistAmount,
        commissionAmount,
      },
      mongoSession,
    );
  }

  async releaseHoldings(tid: string, session: ClientSession) {
    const transaction = await this.getTransaction(tid);
    const wallet = await this.getWalletBalance(transaction.user.toHexString());
    wallet.holdedBonusBalance -= transaction.holdedBonusBalance;
    wallet.bonusBalance += transaction.holdedBonusBalance;
    wallet.holdedMainBalance -= transaction.holdedMainBalance;
    wallet.mainBalance += transaction.holdedMainBalance;
    wallet.holdedTrialMinutes -= transaction.holdedTrialMinutes;
    wallet.freeTrialMinutes += transaction.holdedTrialMinutes;

    await this.createTransaction(
      {
        user: transaction.user.toHexString(),
        therapist: null,
        amount: transaction.amount,
        tid: null,
        type: TRANSACTION_TYPE.REVERT_TRANSACTION,
        status: TRANSACTION_STATUS.SUCCESS,
        remarks: 'Revert balance if request is expired or withdrawn',
        holdedMainBalance: transaction.holdedMainBalance,
        holdedBonusBalance: transaction.holdedBonusBalance,
        holdedTrialMinutes: transaction.holdedTrialMinutes,
      },
      session,
    );
    return await wallet.save({ session });
  }

  async getTransaction(tid: string) {
    const transaction = await this.transactionModel.findOne({ tid });
    return transaction;
  }

  async addWalletBalance(
    userId: string,
    amount: number,
    availableVATCharge: number,
    transactionId: string,
    session: ClientSession,
    userRedeemedCouponCodeId?: string,
  ) {
    const wallet = await this.walletModel.findOneAndUpdate(
      { user: userId },
      {
        $inc: {
          mainBalance: amount,
          availableVATCharge: availableVATCharge,
        },
      },
    );

    await this.createTransaction(
      {
        user: userId,
        therapist: null,
        amount,
        tid: transactionId,
        type: TRANSACTION_TYPE.TOPUP,
        status: TRANSACTION_STATUS.SUCCESS,
        remarks: `Account topped up with ${amount}£`,
        availableVATCharge: availableVATCharge,
        VATCharge: availableVATCharge,
        userRedeemedCouponCodeId,
      },
      session,
    );

    const user = await this.userRepository.getUserById(userId);
    const adminUsers = await this.userRepository.getAllAdmins();

    this.eventEmitter.emit(events.USER_TOP_UP, {
      userName: `${user.firstName} ${user.lastName}`,
      admins: adminUsers,
      amount: amount,
    });

    this.socketGateway.sendMessageToActiveUsers(
      NOTIFICATION_TYPE.USER_TOP_UP_SUCCESS,
      [userId],
      {},
    );

    return wallet;
  }

  async createTransaction(
    {
      user,
      therapist,
      amount,
      tid,
      type,
      status,
      remarks,
      holdedMainBalance = 0,
      holdedBonusBalance = 0,
      holdedTrialMinutes = 0,
      therapistAmount = 0,
      commissionAmount = 0,
      usedFreeTrialMinutes = 0,
      VATCharge = 0,
      therapistVATCharge = 0,
      platformVATCharge = 0,
      availableVATCharge = 0,
      userRedeemedCouponCodeId = null,
      extraCharge = 0,
    }: {
      user: string;
      therapist?: string;
      amount: number;
      tid: string;
      type: string;
      status: string;
      remarks: string;
      holdedMainBalance?: number;
      holdedBonusBalance?: number;
      holdedTrialMinutes?: number;
      therapistAmount?: number;
      commissionAmount?: number;
      usedFreeTrialMinutes?: number;
      VATCharge?: number;
      therapistVATCharge?: number;
      platformVATCharge?: number;
      availableVATCharge?: number;
      userRedeemedCouponCodeId?: string;
      extraCharge?: number;
    },
    session: ClientSession,
  ) {
    console.log('therapist : ', therapist);

    const transaction = new this.transactionModel({
      user: new Types.ObjectId(user),
      therapist: therapist ?? new Types.ObjectId(therapist),
      type,
      status,
      amount,
      tid: tid ?? uuidv4(),
      remarks,
      holdedMainBalance,
      holdedBonusBalance,
      holdedTrialMinutes,
      therapistAmount,
      commissionAmount,
      usedFreeTrialMinutes: Number(usedFreeTrialMinutes.toFixed(2)),
      VATCharge,
      therapistVATCharge,
      platformVATCharge,
      availableVATCharge,
      userRedeemedCouponCodeId,
      extraCharge,
    });
    return await transaction.save({ session });
  }

  async withdrawWalletBalance(
    userId: string,
    amount: number,
    tid: string,
    session: ClientSession,
  ) {
    const wallet = await this.walletModel.findOneAndUpdate(
      { user: userId },
      {
        $inc: {
          withdrawalBalance: -amount,
        },
      },
      { new: true },
    );

    await this.createTransaction(
      {
        user: userId,
        therapist: null,
        amount,
        tid,
        type: TRANSACTION_TYPE.WITHDRAW,
        status: TRANSACTION_STATUS.PENDING,
        remarks: `An amount of ${amount} is withdrawn from account`,
      },
      session,
    );

    const user = await this.userRepository.getUserById(userId);
    const adminUsers = await this.userRepository.getAllAdmins();

    this.eventEmitter.emit(events.THERAPIST_WITHDRAW, {
      userName: `${user.firstName} ${user.lastName}`,
      admins: adminUsers,
      amount: amount,
    });

    return wallet;
  }

  async getTransactions(
    filter: FilterQuery<ITransactionDocument>,
    options: PaginateOptions,
  ) {
    const transactions: PaginateResult<ITransactionDocument> =
      await this.transactionModel.paginate(filter, options);
    return transactions;
  }

  async confirmTransaction(transactionId: string) {
    const transaction = await this.transactionModel.findOne({
      tid: transactionId,
    });
    if (transaction && transaction.status === TRANSACTION_STATUS.PENDING) {
      await this.transactionModel.findOneAndUpdate(
        { tid: transactionId },
        { $set: { status: TRANSACTION_STATUS.SUCCESS } },
      );
      const wallet = await this.walletModel.findOneAndUpdate(
        { user: transaction.user },
        {
          $inc: {
            holdedMainBalance: -transaction.amount,
          },
        },
      );
      return wallet;
    }
  }

  async failedTransaction(transactionId: string) {
    const transaction = await this.transactionModel.findOne({
      tid: transactionId,
    });
    if (transaction) {
      await this.transactionModel.findOneAndUpdate(
        { tid: transactionId },
        { $set: { status: TRANSACTION_STATUS.FAILED } },
      );
      const wallet = await this.walletModel.findOneAndUpdate(
        { user: transaction.user },
        {
          $inc: {
            holdedMainBalance: -transaction.amount,
            mainBalance: transaction.amount,
          },
        },
      );

      return wallet;
    }
  }

  async getWalletByUserId(userId: string) {
    const wallet = await this.walletModel.findOne({
      user: new Types.ObjectId(userId),
    });
    return wallet;
  }

  async getWallet(filter: FilterQuery<IWalletDocument>) {
    const wallet = await this.walletModel.findOne(filter);
    return wallet;
  }

  async updateWalletOnCall(
    userId: string,
    deductAmount: number,
    remainingFreeTrialMinutes: number,
  ) {
    const wallet = await this.walletModel.findOneAndUpdate(
      { user: userId },
      {
        freeTrialMinutes: remainingFreeTrialMinutes,
        $inc: {
          mainBalance: -deductAmount,
        },
      },
      {
        new: true,
      },
    );
    return wallet;
  }

  async getDeduction(
    userId: string,
    callMinutes: number,
    therapistId: string,
  ): Promise<DeductionData> {
    const wallet = await this.getWalletBalance(userId);
    let remainingFreeTrialMinutes = 0;
    let deductAmount = 0;
    let chargeMinutes = callMinutes;
    let usedFreeTrialMinutes = 0;
    let userReferToTherapist = false;

    const CALL_CHARGE_PER_MINUTE =
      await this.systemConfigRepository.getCallChargePerMinute();

    let chargePerMinute = CALL_CHARGE_PER_MINUTE;

    // check is user register with therapists referral code
    const referral = await this.userRepository.checkIsUserReferToTherapist(
      userId,
      therapistId,
    );

    if (referral) {
      const therapistProfile = await this.userRepository.getTherapistProfile(
        therapistId,
      );

      const therapistPerHourCharge = therapistProfile.perHourCharge;
      if (therapistPerHourCharge > 0) {
        chargePerMinute = therapistPerHourCharge / 60;
        userReferToTherapist = true;
      }
    }

    const noOfFreeTrialSessions = await this.getNoOfFreeTrialSessionCompleted(
      userId,
    );

    if (
      wallet.freeTrialMinutes &&
      noOfFreeTrialSessions < SESSION_CONSTANT.MAX_FREE_TRIALS_CALLS
    ) {
      if (callMinutes <= wallet.freeTrialMinutes) {
        remainingFreeTrialMinutes = wallet.freeTrialMinutes - callMinutes;

        usedFreeTrialMinutes =
          wallet.freeTrialMinutes - remainingFreeTrialMinutes;

        chargeMinutes = 0;
      } else {
        chargeMinutes = callMinutes - wallet.freeTrialMinutes;
        usedFreeTrialMinutes = callMinutes - chargeMinutes;
      }
    }

    let extraCharge = 0;

    if (chargeMinutes > 0) {
      const minutes = Math.floor(chargeMinutes);
      const secondsInDecimal = chargeMinutes - minutes;
      const seconds = (secondsInDecimal * 60) / 100;

      const onlyPerMinutesCharge = minutes * chargePerMinute;
      const onlyPerSecondsCharge = seconds * chargePerMinute;

      deductAmount = onlyPerMinutesCharge + onlyPerSecondsCharge;

      if (userReferToTherapist) {
        extraCharge = (deductAmount * 5) / 100;
      }
    }

    return {
      deductAmount,
      remainingFreeTrialMinutes,
      usedFreeTrialMinutes,
      extraCharge,
      userReferToTherapist,
    };
  }

  async walletCheckForSessionRequest(userId: string): Promise<boolean> {
    // const hasTopUpTransaction = await this.hasTopUpTransaction(userId);
    // if (!hasTopUpTransaction) {
    //   throw new BadRequestException("Don't have a top-up transaction");
    // }
    const wallet = await this.getWalletBalance(userId);
    const hasFreeBalance = await wallet.hasFreeMinutes();

    const CALL_CHARGE_PER_MINUTE =
      await this.systemConfigRepository.getCallChargePerMinute();

    const hasEnoughBalance = await wallet.hasEnoughBalance(
      CALL_CHARGE_PER_MINUTE,
    );

    if (hasFreeBalance) {
      const noOfFreeTrialSessions = await this.getNoOfFreeTrialSessionCompleted(
        userId,
      );

      if (
        noOfFreeTrialSessions >= SESSION_CONSTANT.MAX_FREE_TRIALS_CALLS &&
        !hasEnoughBalance
      ) {
        throw new BadRequestException(
          'You have exceeded free trials minutes. Please top-up your wallet.',
        );
      }
      return true;
    }

    if (!hasEnoughBalance) {
      throw new BadRequestException('Insufficient funds');
    }

    return true;
  }

  async isCallEndDueToLowBalance(
    userId: string,
    deductAmount: number,
  ): Promise<boolean> {
    const wallet = await this.getWalletBalance(userId);
    const hasEnoughBalance = await wallet.hasEnoughBalance(deductAmount);

    if (!hasEnoughBalance) {
      return true;
    } else {
      return false;
    }
  }

  async getNoOfFreeTrialSessionCompleted(userId: string) {
    const noOfFreeTrialSessions = await this.sessionModel.count({
      sessionType: SESSION_TYPE.REQUEST,
      sessionStatus: SESSION_STATUS.ENDED,
      'attendees.user': { $in: [userId] },
    });

    return noOfFreeTrialSessions;
  }

  async weeklyCalculatedWithdrawalAmountJob(session: ClientSession) {
    const allTherapists = await this.userRepository.getAllTherapist();
    const therapistIds = allTherapists.map((therapist) => therapist._id);
    const withdrawalRequests = [];

    for (let i = 0; i < therapistIds.length; i++) {
      const endDate = moment();
      const startDate = endDate.clone().subtract(1, 'weeks').isoWeekday(5);

      const therapistId = therapistIds[i];
      const therapistWallet = await this.getWalletByUserId(therapistId);

      let withdrawalRequest = new this.WeeklyWithdrawalRequestModel({
        therapist: therapistWallet.user,
        amount: therapistWallet.mainBalance,
        startDate: startDate,
        endDate: endDate,
      });
      withdrawalRequest = await withdrawalRequest.save({ session });

      const wallet = await this.walletModel.findOneAndUpdate(
        { user: therapistWallet.user },
        {
          $inc: {
            mainBalance: -therapistWallet.mainBalance,
            withdrawalBalance: +therapistWallet.mainBalance,
          },
        },
        { new: true },
      );

      withdrawalRequests.push(withdrawalRequest);
    }

    return withdrawalRequests;
  }

  async allWeeklyWithdrawalRequests() {
    const allWeeklyWithdrawalRequests =
      await this.WeeklyWithdrawalRequestModel.find().exec();
    return allWeeklyWithdrawalRequests;
  }

  async removeUserWallet(userId: string) {
    const removeUserWallet = await this.walletModel.deleteOne({
      user: userId,
    });
    return removeUserWallet;
  }

  async createSubscriptionRecord(
    userId: string,
    amount: number,
    transactionId: string,
    VATCharge: number,
    session: ClientSession,
  ) {
    let baseAmount = amount / 100;
    const baseVATCharge = VATCharge / 100;
    baseAmount = baseAmount - baseVATCharge;
    const transaction = await this.createTransaction(
      {
        user: userId,
        therapist: null,
        amount: baseAmount,
        tid: transactionId,
        type: TRANSACTION_TYPE.SUBSCRIPTION,
        status: TRANSACTION_STATUS.SUCCESS,
        remarks: `Account purchased subscription with ${baseAmount}£`,
        VATCharge: baseVATCharge,
      },
      session,
    );
    return transaction;
  }

  async hasTopUpTransactionSpecificAmount(userId: string, amount: number) {
    const transaction = await this.transactionModel.findOne({
      user: userId,
      type: TRANSACTION_TYPE.TOPUP,
      status: TRANSACTION_STATUS.SUCCESS,
      amount: { $gte: amount },
    });

    if (!transaction) {
      return false;
    }

    return true;
  }

  async resetAllTherapistsWallet() {
    const wallets = await this.walletModel.find();

    const therapistIds = await this.userRepository.getAllTherapistIds();
    const wallet = await this.walletModel.findOneAndUpdate(
      { user: therapistIds },
      {
        mainBalance: 0,
      },
    );

    return wallets;
  }
}
