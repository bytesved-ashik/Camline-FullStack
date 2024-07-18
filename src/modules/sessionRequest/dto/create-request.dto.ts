import {
  IsString,
  IsNotEmpty,
  IsArray,
  ArrayMinSize,
  IsEnum,
  IsOptional,
} from 'class-validator';
import {
  IsValidObjectId,
  IsValidObjectIdArray,
} from '@decorators/valid-id.decorator';
import { ApiProperty } from '@nestjs/swagger';
import { REQUEST_STATUS } from '@enums';
import { REQUEST_TYPE } from '@enums';

export class CreateRequestDto {
  @IsArray()
  @ArrayMinSize(1)
  @IsValidObjectIdArray()
  categories: string[];

  @IsString()
  @IsNotEmpty()
  query: string;

  @ApiProperty({ enum: REQUEST_TYPE })
  @IsString()
  @IsEnum(REQUEST_TYPE)
  requestType: REQUEST_TYPE;

  @ApiProperty({ enum: Object.values(REQUEST_STATUS) })
  @IsString()
  @IsEnum(REQUEST_STATUS)
  requestStatus: REQUEST_STATUS;

  @IsOptional()
  @IsValidObjectId()
  therapist: string;
}
