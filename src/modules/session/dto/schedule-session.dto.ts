import { IsDate, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';
export class ScheduleSessionDto {
  @IsNumber()
  duration: number;

  @Type(() => Date)
  @IsDate()
  sessionStartTime: Date;
}
