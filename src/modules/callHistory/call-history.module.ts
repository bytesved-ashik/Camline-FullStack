import { Module } from '@nestjs/common';
import { CallHistoryService } from './call-history.service';
import { MongooseModule } from '@nestjs/mongoose';
import { CallHistory, CallHistorySchema } from '@entities/call-history.entity';
import { CallHistoryRepository } from '@repositories/callHistory.repository';
import { CallHistoryController } from './call-history.controller';
import * as paginate from 'mongoose-paginate-v2';

@Module({
  imports: [
    MongooseModule.forFeatureAsync([
      {
        name: CallHistory.name,
        useFactory: () => {
          CallHistorySchema.plugin(paginate);
          return CallHistorySchema;
        },
      },
    ]),
  ],
  controllers: [CallHistoryController],
  providers: [CallHistoryService, CallHistoryRepository],
  exports: [CallHistoryService, CallHistoryRepository],
})
export class CallHistoryModule {}
