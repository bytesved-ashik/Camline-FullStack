import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ErrorLog, ErrorLogSchema } from '@entities/errorLog.entity';
import { ErrorLogRepository } from '@repositories/errorLog.repository';
import { AllExceptionsFilter } from './errorLog.service';

@Module({
  imports: [
    MongooseModule.forFeatureAsync([
      {
        name: ErrorLog.name,
        useFactory: () => {
          return ErrorLogSchema;
        },
      },
    ]),
  ],
  providers: [AllExceptionsFilter, ErrorLogRepository],
  exports: [AllExceptionsFilter, ErrorLogRepository],
})
export class ErrorLogModule {}
