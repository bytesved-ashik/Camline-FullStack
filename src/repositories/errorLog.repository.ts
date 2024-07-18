import { ErrorLog } from '@entities/errorLog.entity';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { IErrorLogModel } from 'src/types/interfaces';

@Injectable()
export class ErrorLogRepository {
  constructor(
    @InjectModel(ErrorLog.name) private readonly errorLogModel: IErrorLogModel,
  ) {}

  async logErrorToDatabase(
    status: number,
    message: string,
    url: string,
    errorType: string,
    errorDetails: string,
  ): Promise<void> {
    try {
      const newError = new this.errorLogModel({
        statusCode: status,
        message: message,
        path: url,
        error: errorType,
        errorDetails: errorDetails,
      });
      await newError.save();
    } catch (error) {
      console.log(`Failed to log error to database: ${error.message}`);
    }
  }
}
