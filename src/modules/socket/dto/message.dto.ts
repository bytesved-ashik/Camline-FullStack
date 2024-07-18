import {
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsString,
} from 'class-validator';
import { MESSAGE_TYPE } from '@enums';
import { ApiProperty } from '@nestjs/swagger';
import { IsValidObjectIdArray } from '@decorators/valid-id.decorator';

export class MessageDto {
  @IsNotEmpty()
  @IsString()
  message: string;

  @IsArray()
  @ArrayMinSize(1)
  @IsValidObjectIdArray()
  userId: string[];

  @ApiProperty({ enum: Object.values(MESSAGE_TYPE) })
  @IsString()
  @IsNotEmpty()
  @IsEnum(MESSAGE_TYPE)
  messageType: MESSAGE_TYPE;
}
