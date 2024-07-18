import { GetQueryDto } from '@dto/getQuery.dto';
import { ROLE, USER_STATUS } from '@enums';
import { IsEnum, IsOptional } from 'class-validator';

export class GetUserDto extends GetQueryDto {
  @IsOptional()
  @IsEnum(USER_STATUS)
  status?: USER_STATUS;

  @IsOptional()
  @IsEnum(ROLE)
  role?: ROLE;
}
