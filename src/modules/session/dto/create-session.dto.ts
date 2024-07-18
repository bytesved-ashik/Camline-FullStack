import { Type } from 'class-transformer';
import { IsNumber, IsString, IsDate, IsArray, IsEnum } from 'class-validator';
import { IsValidObjectId } from '@decorators/valid-id.decorator';
import { SESSION_TYPE } from '@enums';
import { Types } from 'mongoose';
import { IsValidObjectIdArray } from '@decorators/valid-id.decorator';
export class CreateSessionDto {
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

  @IsArray()
  @IsValidObjectIdArray()
  attendees: string[];
}
