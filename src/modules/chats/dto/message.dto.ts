import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { MESSAGE_TYPE } from '@enums';
import { ApiProperty } from '@nestjs/swagger';
import { IsValidObjectId } from '@decorators/valid-id.decorator';
import { Types } from 'mongoose';

export class ChatMessageDto {
  @IsString()
  message: string;

  @IsValidObjectId()
  chatSessionId: string;

  @IsOptional()
  @IsValidObjectId()
  session: Types.ObjectId;

  @ApiProperty({ enum: Object.values(MESSAGE_TYPE) })
  @IsString()
  @IsNotEmpty()
  @IsEnum(MESSAGE_TYPE)
  messageType: MESSAGE_TYPE;
}
