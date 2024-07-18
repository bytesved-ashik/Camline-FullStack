import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { ErrorLogRepository } from '@repositories/errorLog.repository';
import { AnyAaaaRecord } from 'dns';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  constructor(
    private readonly httpAdapterHost: HttpAdapterHost,
    private readonly errorLogRepository: ErrorLogRepository,
  ) {}

  async catch(exception: HttpException, host: ArgumentsHost) {
    // In certain situations `httpAdapter` might not be available in the
    // constructor method, thus we should resolve it here.
    const { httpAdapter } = this.httpAdapterHost;

    const ctx = host.switchToHttp();

    const httpStatus =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    function extractMethodNameFromError(errorString: string): string {
      const regex = /at (\S+) \(/;
      const match = regex.exec(errorString);
      if (match && match.length > 1) {
        return match[1];
      }
      return '';
    }

    const methodName = extractMethodNameFromError(exception.stack);

    let exceptionMessage = exception.message;
    const exceptionResponse: any = exception.getResponse();

    if (exceptionResponse && exceptionResponse.message) {
      exceptionMessage = exceptionResponse.message;

      if (Array.isArray(exceptionMessage)) {
        exceptionMessage = exceptionMessage[0];
      }
    }

    const errorDetails = `time: ${new Date().toISOString()}, message: ${exceptionMessage}, path: ${httpAdapter.getRequestUrl(
      ctx.getRequest(),
    )}, function: ${methodName}, status: ${httpStatus}, error: ${
      exception.name
    }`;

    await this.errorLogRepository.logErrorToDatabase(
      httpStatus,
      exceptionMessage,
      httpAdapter.getRequestUrl(ctx.getRequest()),
      exception.name,
      errorDetails,
    );

    const responseBody = {
      statusCode: httpStatus,
      message: exceptionMessage,
      error: exception.name,
    };

    httpAdapter.reply(ctx.getResponse(), responseBody, httpStatus);
  }
}
