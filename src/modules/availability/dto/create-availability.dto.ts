import { AvailabilityObjectDto } from './availability.object.dto';
import {
  IsArray,
  ArrayMinSize,
  ValidateNested,
  IsNotEmpty,
  IsBoolean,
  ValidateIf,
  ArrayMaxSize,
  ArrayUnique,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateAvailabilityDto {
  @IsNotEmpty()
  @IsBoolean()
  is24HoursAvailable;

  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(7)
  @ValidateNested({ each: true })
  @ArrayUnique((obj: AvailabilityObjectDto) => obj.dayInString)
  @Type(() => AvailabilityObjectDto)
  @ValidateIf((object) => !object.is24HoursAvailable)
  availability: AvailabilityObjectDto[];
}
