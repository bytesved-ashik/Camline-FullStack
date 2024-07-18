import { Type } from 'class-transformer';
import { IsNumber, IsString, IsDate, IsEnum } from 'class-validator';
import { IsValidObjectId } from '@decorators/valid-id.decorator';
import { SESSION_TYPE } from '@enums';
import { Types } from 'mongoose';

export class ScheduleSessionNewDto {
  @IsValidObjectId()
  user: Types.ObjectId;

  @IsValidObjectId()
  therapist: Types.ObjectId;

  @IsNumber()
  sessionPrice: number;

  @IsNumber()
  duration: number;

  @Type(() => Date)
  @IsDate()
  sessionStartTime: Date;

  @IsString()
  @IsEnum(SESSION_TYPE)
  sessionType: string;

  @IsValidObjectId()
  request: Types.ObjectId;

  @IsString()
  tid: string;
}
