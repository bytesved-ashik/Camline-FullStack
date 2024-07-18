import { ApiProperty } from '@nestjs/swagger';
import {
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsString,
} from 'class-validator';
import { MEDIA_TYPE } from '@enums';
import { IsValidObjectIdArray } from '@decorators/valid-id.decorator';

export class MediaObjectDto {
  @ApiProperty({ enum: Object.values(MEDIA_TYPE) })
  @IsString()
  @IsNotEmpty()
  @IsEnum(MEDIA_TYPE)
  type: MEDIA_TYPE;

  @IsArray()
  @ArrayMinSize(1)
  @IsValidObjectIdArray()
  mediaId: string[];
}
