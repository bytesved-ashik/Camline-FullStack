import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import * as paginate from 'mongoose-paginate-v2';
import { Interest, InterestSchema } from '@entities/interest.entity';
import { InterestRepository } from '@repositories/interest.repository';
import { InterestController } from './interest.controller';
import { InterestService } from './interest.service';

@Module({
  imports: [
    MongooseModule.forFeatureAsync([
      {
        name: Interest.name,
        useFactory: () => {
          InterestSchema.plugin(paginate);
          return InterestSchema;
        },
      },
    ]),
  ],
  controllers: [InterestController],
  providers: [InterestService, InterestRepository],
  exports: [InterestService],
})
export class InterestModule {}
