import { Injectable } from '@nestjs/common';
import { CallHistoryRepository } from '@repositories/callHistory.repository';
import { ICallHistoryDocument } from 'src/types/interfaces';
import { CreateCallHistoryDto } from './dto/create.callHistory.dto';
import { FilterQuery, PaginateOptions } from 'mongoose';

@Injectable()
export class CallHistoryService {
  constructor(private readonly callHistoryRepository: CallHistoryRepository) {}

  async createCallHistory(data: CreateCallHistoryDto) {
    const callHistory = await this.callHistoryRepository.createCallHistory(
      data,
    );

    return callHistory;
  }

  async getCallHistories(
    filter: FilterQuery<ICallHistoryDocument>,
    options?: PaginateOptions,
  ) {
    const categories = await this.callHistoryRepository.getCallHistories(
      filter,
      options,
    );
    return categories;
  }
}
