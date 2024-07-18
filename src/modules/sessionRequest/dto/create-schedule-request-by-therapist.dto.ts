import {
  IsNotEmpty,
  IsDate,
  IsArray,
  IsOptional,
  MinDate,
  IsNumber,
  IsString,
} from 'class-validator';
import {
  IsValidObjectId,
  IsValidObjectIdArray,
} from '@decorators/valid-id.decorator';
import { Transform } from 'class-transformer';

export class CreateScheduleRequestByTherapistDto {
  @IsValidObjectId()
  @IsNotEmpty()
  userId: string;

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
  @IsNumber()
  duration: number;

  @IsNotEmpty()
  @IsString()
  streamId: string;
}
