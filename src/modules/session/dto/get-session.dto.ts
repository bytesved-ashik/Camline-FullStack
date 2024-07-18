import { GetQueryDto } from '@dto/getQuery.dto';
import { SESSION_STATUS, SESSION_TYPE } from '@enums';
import { IsEnum, IsOptional } from 'class-validator';

export class GetSessionDto extends GetQueryDto {
  @IsOptional()
  @IsEnum(SESSION_TYPE)
  sessionType?: SESSION_TYPE;

  @IsOptional()
  @IsEnum(SESSION_STATUS)
  sessionStatus?: SESSION_STATUS;
}
