import { Injectable } from '@nestjs/common';
import { FilterQuery, ClientSession, PaginateOptions } from 'mongoose';
import { WalletRepository } from '@repositories/wallet.repository';
import { ITransactionDocument } from 'src/types/interfaces';
import { SESSION_CONSTANT } from '@constants/index';

@Injectable()
export class WalletService {
  constructor(private readonly walletRepository: WalletRepository) {}
  async getBalance(userId: string) {
    const wallet = await this.walletRepository.getWalletBalance(userId);
    return wallet;
  }

  async getWalletByUserId(userId: string) {
    const wallet = await this.walletRepository.getWalletByUserId(userId);
    return wallet;
  }

  async getWalletByStripeCustomerId(stripeCustomerId: string) {
    const wallet = await this.walletRepository.getWallet({
      stripeCustomerId,
    });
    return wallet;
  }

  async addWalletBalance(
    userId: string,
    amount: number,
    transactionId: string,
    session: ClientSession,
    userRedeemedCouponCodeId?: string,
  ) {
    const availableVATCharge: number =
      (amount * SESSION_CONSTANT.VAT_CHARGE_PERCENTAGE) / 100;

    const wallet = await this.walletRepository.addWalletBalance(
      userId,
      amount,
      availableVATCharge,
      transactionId,
      session,
      userRedeemedCouponCodeId,
    );
    return wallet;
  }

  async holdBalance(userId: string, amount: number, session: ClientSession) {
    const wallet = await this.walletRepository.holdBalanceForRequest(
      userId,
      amount,
      session,
    );
    return wallet;
  }

  async withdrawWalletBalance(
    userId: string,
    amount: number,
    tid: string,
    session: ClientSession,
  ) {
    const wallet = await this.walletRepository.withdrawWalletBalance(
      userId,
      amount,
      tid,
      session,
    );
    return wallet;
  }

  async successPayment(paymentId: string) {
    this.walletRepository.confirmTransaction(paymentId);
  }

  async failedPayment(paymentId: string) {
    this.walletRepository.failedTransaction(paymentId);
  }

  async getTransactions(
    filter: FilterQuery<ITransactionDocument>,
    options: PaginateOptions,
  ) {
    const transactions = await this.walletRepository.getTransactions(
      filter,
      options,
    );
    return transactions;
  }

  async updateWalletOnCall(
    userId: string,
    deductAmount: number,
    remainingFreeTrialMinutes: number,
  ) {
    const wallet = await this.walletRepository.updateWalletOnCall(
      userId,
      deductAmount,
      remainingFreeTrialMinutes,
    );
    return wallet;
  }

  async weeklyCalculatedWithdrawalAmountJob(session: ClientSession) {
    const weeklyCalculatedWithdrawalAmountJob =
      await this.walletRepository.weeklyCalculatedWithdrawalAmountJob(session);
    return weeklyCalculatedWithdrawalAmountJob;
  }

  async allWeeklyWithdrawalRequests() {
    const allWeeklyWithdrawalRequests =
      await this.walletRepository.allWeeklyWithdrawalRequests();
    return allWeeklyWithdrawalRequests;
  }

  async removeUserWallet(userId: string) {
    return await this.walletRepository.removeUserWallet(userId);
  }

  async createSubscriptionRecord(
    userId: string,
    amount: number,
    transactionId: string,
    VATCharge: number,
    session: ClientSession,
  ) {
    const wallet = await this.walletRepository.createSubscriptionRecord(
      userId,
      amount,
      transactionId,
      VATCharge,
      session,
    );
    return wallet;
  }

  async hasTopUpTransactionSpecificAmount(userId: string, amount: number) {
    return await this.walletRepository.hasTopUpTransactionSpecificAmount(
      userId,
      amount,
    );
  }

  async resetAllTherapistsWallet() {
    return await this.walletRepository.resetAllTherapistsWallet();
  }
}
