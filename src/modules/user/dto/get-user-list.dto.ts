import { GetQueryDto } from '@dto/getQuery.dto';
import { IsEnum, IsArray, IsOptional } from 'class-validator';
import { USER_STATUS } from 'src/types/enums';

export class GetUserListDto extends GetQueryDto {
  @IsOptional()
  @IsArray()
  categories?: string[];

  @IsOptional()
  @IsEnum(USER_STATUS)
  status?: USER_STATUS;
}
