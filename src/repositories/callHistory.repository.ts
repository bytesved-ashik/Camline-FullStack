import { InjectModel } from '@nestjs/mongoose';
import { CallHistory } from '@entities/call-history.entity';
import { ICallHisotryModel, ICallHistoryDocument } from '@interfaces';
import { FilterQuery, PaginateOptions } from 'mongoose';
import { CreateCallHistoryDto } from '@modules/callHistory/dto/create.callHistory.dto';

export class CallHistoryRepository {
  constructor(
    @InjectModel(CallHistory.name)
    private readonly callHistoryModel: ICallHisotryModel,
  ) {}

  async createCallHistory(data: CreateCallHistoryDto) {
    const callHistory = await this.callHistoryModel.create(data);
    return callHistory;
  }

  async getCallHistories(
    filter: FilterQuery<ICallHistoryDocument>,
    options?: PaginateOptions,
  ) {
    return this.callHistoryModel.paginate(filter, options);
  }
}
