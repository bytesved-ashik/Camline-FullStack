import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { DAYS_NAME_IN_STRING } from '@enums';
import { IsTime } from '@decorators/is-time.decorator';

export class AvailabilityObjectDto {
  @ApiProperty({ enum: Object.values(DAYS_NAME_IN_STRING) })
  @IsString()
  @IsNotEmpty()
  @IsEnum(DAYS_NAME_IN_STRING)
  dayInString: DAYS_NAME_IN_STRING;

  @IsNotEmpty()
  @IsTime()
  startDate;

  @IsNotEmpty()
  @IsTime()
  endDate;
}
