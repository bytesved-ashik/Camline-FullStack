import { Processor, Define, AgendaService } from '@agent-ly/nestjs-agenda';
import { WalletService } from '@modules/wallet/wallet.service';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection, Types } from 'mongoose';
import * as moment from 'moment';
import { WALLET_CONSTANT } from '@constants/index';
import { UserService } from '@modules/user/user.service';
import { REQUEST_STATUS, ROLE } from 'src/types/enums';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { events } from '@events';

@Processor()
export class AppProcessor {
  constructor(
    @InjectConnection() private readonly mongoConnection: Connection,
    private readonly walletService: WalletService,
    private readonly agendaService: AgendaService,
    private readonly userService: UserService,
    private eventEmitter: EventEmitter2,
  ) {}

  @Define('weeklyCalculatedWithdrawalAmountJob')
  async weeklyCalculatedWithdrawalAmountJob() {
    console.log('Weekly payment created.');

    const weeklyCalculatedWithdrawalAmountJob = async () => {
      const session = await this.mongoConnection.startSession();
      session.startTransaction();

      try {
        const withdrawalRequest =
          await this.walletService.weeklyCalculatedWithdrawalAmountJob(session);
        await session.commitTransaction();

        return withdrawalRequest;
      } catch (error) {
        await session.abortTransaction();
        throw error;
      } finally {
        session.endSession();
      }
    };
    await weeklyCalculatedWithdrawalAmountJob();

    await this.agendaService.cancel({
      name: 'weeklyCalculatedWithdrawalAmountJob',
    });

    const everyFriday = moment()
      .weekday(WALLET_CONSTANT.WEEKLY_WITHDRAW_DAY)
      .startOf('day');

    if (everyFriday.isSameOrBefore(moment())) {
      everyFriday.add(1, 'week');
    }

    await this.agendaService.schedule(
      everyFriday.toDate(),
      'weeklyCalculatedWithdrawalAmountJob',
      {},
    );
  }

  @Define('verifyEmailTokenJob')
  async verifyEmailTokenJob(userId) {
    console.log('Verify email token job run.');

    const removeUserData = async (userId) => {
      const session = await this.mongoConnection.startSession();
      session.startTransaction();
      try {
        const user = await this.userService.getUserById(
          userId.attrs.data.userId,
        );

        if (user.roles.includes(ROLE.USER)) {
          await this.userService.removeUserProfile(user._id);
        } else {
          await this.userService.removeTherapistProfile(user._id);
        }

        await this.userService.removeUserById(user._id);

        await this.walletService.removeUserWallet(user._id);

        await this.userService.deleteUserTokenData(user._id);

        await this.removeJobByUserId(user._id);

        await session.commitTransaction();
      } catch (error) {
        await session.abortTransaction();
        throw error;
      }
    };
    await removeUserData(userId);

    const after72Hours = moment().add(72, 'hours').toDate();
    await this.agendaService.schedule(after72Hours, 'verifyEmailTokenJob', {
      userId,
    });
  }

  async removeJobByUserId(userId: string) {
    try {
      const collection = this.mongoConnection.collection('agendaJobs');
      const userIdObjectId = new Types.ObjectId(userId);

      const query = {
        'data.userId': userIdObjectId,
      };
      return await collection.deleteOne(query);
    } catch (error) {
      console.error(`Error deleting job(s) for userId: ${userId}`, error);
      throw error;
    }
  }

  @Define('scheduleSessionAcceptedSendMailAndSmsBeforeFiveMinutesJob')
  async scheduleSessionAcceptedJob(data) {
    const {
      therapistName,
      therapistEmail,
      userName,
      userEmail,
      time,
      phoneNumbers,
      requestId,
    } = data.attrs.data;

    this.eventEmitter.emit(events.REQUEST_STATUS_UPDATED, requestId, {
      requestStatus: REQUEST_STATUS.SCHEDULED_5_MINUTES_REMAINING,
    });

    // send mail
    this.eventEmitter.emit(
      events.SCHEDULED_REQUEST_SEND_MAIL_BEFORE_FIVE_MINUTES,
      {
        therapistName: therapistName,
        therapistEmail: therapistEmail,
        userName: userName,
        userEmail: userEmail,
        time: time,
      },
    );

    // send sms
    this.eventEmitter.emit(events.CUSTOM_SMS_SEND, {
      phoneNumbers: phoneNumbers,
      body: `Just 5 minutes remaining, Your scheduled session will started at ${time}.`,
    });
  }
}
