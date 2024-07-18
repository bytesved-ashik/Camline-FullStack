import { AgendaService } from '@agent-ly/nestjs-agenda';
import { WALLET_CONSTANT } from '@constants/index';
import { Injectable } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection, Types } from 'mongoose';
import * as moment from 'moment';
import { IScheduleSessionAcceptedSendMailAndSmsBeforeFiveMinutesJobData } from 'src/types/interfaces/common.interface';

@Injectable()
export class AgendaAppService {
  constructor(
    @InjectConnection() private readonly mongoConnection: Connection,
    public readonly agendaService: AgendaService,
  ) {}

  async weeklyCalculatedWithdrawalAmountJob() {
    console.log('Weekly job created.');
    const isAlreadyExist = await this.agendaService.jobs({
      name: 'weeklyCalculatedWithdrawalAmountJob',
    });

    if (isAlreadyExist.length == 0) {
      const everyFriday = moment()
        .weekday(WALLET_CONSTANT.WEEKLY_WITHDRAW_DAY)
        .startOf('day');

      if (everyFriday.isSameOrBefore(moment())) {
        everyFriday.add(1, 'week');
      }

      console.log(everyFriday.toDate());
      this.agendaService.schedule(
        everyFriday.toDate(),
        'weeklyCalculatedWithdrawalAmountJob',
        {},
      );
    }
  }

  async removeUserDataJob(userId) {
    console.log('Verify email token job created.');

    const after72Hours = moment().add(72, 'hours').toDate();

    this.agendaService.schedule(after72Hours, 'verifyEmailTokenJob', {
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

  async scheduleSessionAcceptedSendMailAndSmsBeforeFiveMinutesJob(
    data: IScheduleSessionAcceptedSendMailAndSmsBeforeFiveMinutesJobData,
  ) {
    const { runAt, requestId } = data;
    console.log('test job created.');

    const isJobAlreadyExists = await this.agendaService.jobs({
      name: 'scheduleSessionAcceptedSendMailAndSmsBeforeFiveMinutesJob',
      'data.requestId': requestId,
    });

    if (isJobAlreadyExists && isJobAlreadyExists.length == 0) {
      this.agendaService.schedule(
        runAt,
        'scheduleSessionAcceptedSendMailAndSmsBeforeFiveMinutesJob',
        data,
      );
    }
  }
}
