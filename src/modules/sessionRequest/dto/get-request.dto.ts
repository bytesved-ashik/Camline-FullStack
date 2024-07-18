import { GetQueryDto } from '@dto/getQuery.dto';
import { REQUEST_STATUS, REQUEST_TYPE } from '@enums';
import { IsEnum, IsOptional } from 'class-validator';

export class GetRequestDto extends GetQueryDto {
  @IsOptional()
  @IsEnum(REQUEST_STATUS)
  requestStatus?: REQUEST_STATUS;

  @IsOptional()
  @IsEnum(REQUEST_TYPE)
  requestType?: REQUEST_TYPE;
}
