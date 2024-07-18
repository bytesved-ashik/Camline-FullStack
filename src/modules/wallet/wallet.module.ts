import { Wallet, WalletSchema } from '@entities/wallet.entity';
import { Transaction, TransactionSchema } from '@entities/transaction.entity';
import { Module, forwardRef } from '@nestjs/common';
import * as paginate from 'mongoose-paginate-v2';
import { MongooseModule } from '@nestjs/mongoose';
import { WalletController } from './wallet.controller';
import { WalletRepository } from '@repositories/wallet.repository';
import { WalletService } from './wallet.service';
import { Token, TokenSchema } from '@entities/token.entity';
import { IWalletDocument } from 'src/types/interfaces';
import { UserModule } from '@modules/user/user.module';
import { SettingsModule } from '@modules/settings/settings.module';
import { ClientSession } from 'mongoose';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { CallHistoryModule } from '@modules/callHistory/call-history.module';
import { Session, SessionSchema } from '@entities/session.entity';
import {
  WeeklyWithdrawalRequest,
  WeeklyWithdrawalRequestSchema,
} from '@entities/weekly-withdrawal-request.entity';
import { AgendaAppService } from '@utils/agenda.service';
import { SocketGateway } from '../socket/socket.gateway';
import { SocketModule } from '@modules/socket/socket.module';

@Module({
  imports: [
    forwardRef(() => UserModule),
    forwardRef(() => SettingsModule),
    forwardRef(() => CallHistoryModule),
    forwardRef(() => SocketModule),
    EventEmitterModule.forRoot(),
    MongooseModule.forFeatureAsync([
      {
        name: Token.name,
        useFactory: () => {
          return TokenSchema;
        },
      },
      {
        name: Session.name,
        useFactory: () => {
          return SessionSchema;
        },
      },
      {
        name: Wallet.name,
        useFactory: () => {
          WalletSchema.method(
            'hasFreeMinutes',
            async function (): Promise<boolean> {
              return this.freeTrialMinutes > 0;
            },
          );

          WalletSchema.method(
            'holdTrialMinute',
            async function (session: ClientSession): Promise<IWalletDocument> {
              this.freeTrialMinutes -= 1;
              this.holdedTrialMinutes += 1;
              return await this.save({ session });
            },
          );

          WalletSchema.method(
            'hasEnoughBalance',
            async function (balance: number): Promise<boolean> {
              const totalCharge = balance;

              return (
                this.mainBalance + this.bonusBalance > 0 &&
                this.mainBalance + this.bonusBalance >= totalCharge
              );
            },
          );

          WalletSchema.method(
            'holdBalance',
            async function (
              mainBalance: number,
              bonusBalance: number,
              session: ClientSession,
            ): Promise<IWalletDocument> {
              this.mainBalance -= mainBalance;
              this.holdedMainBalance += mainBalance;
              this.bonusBalance -= bonusBalance;
              this.holdedBonusBalance += bonusBalance;
              return await this.save({ session });
            },
          );

          return WalletSchema;
        },
      },
      {
        name: Transaction.name,
        useFactory: () => {
          TransactionSchema.plugin(paginate);
          return TransactionSchema;
        },
      },
    ]),
    MongooseModule.forFeatureAsync([
      {
        name: WeeklyWithdrawalRequest.name,
        useFactory: () => {
          return WeeklyWithdrawalRequestSchema;
        },
      },
    ]),
  ],
  controllers: [WalletController],
  providers: [WalletService, WalletRepository, AgendaAppService, SocketGateway],
  exports: [WalletService, WalletRepository],
})
export class WalletModule {}
