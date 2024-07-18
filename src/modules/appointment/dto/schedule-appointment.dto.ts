import {
  IsNotEmpty,
  IsDate,
  IsArray,
  IsOptional,
  MinDate,
} from 'class-validator';
import {
  IsValidObjectId,
  IsValidObjectIdArray,
} from '@decorators/valid-id.decorator';
import { Transform } from 'class-transformer';
import { IsDateGreater } from '@decorators/is-date-greater.decorator';

export class ScheduleAppointmentDto {
  @IsValidObjectId()
  @IsNotEmpty()
  therapistId: string;

  @IsOptional()
  @IsArray()
  @IsValidObjectIdArray()
  documents: string[];

  @IsNotEmpty()
  @Transform(({ value }) => new Date(value))
  @IsDate()
  @MinDate(new Date())
  startDate: Date;

  @IsNotEmpty()
  @Transform(({ value }) => new Date(value))
  @IsDate()
  @IsDateGreater('startDate')
  endDate: Date;
}
