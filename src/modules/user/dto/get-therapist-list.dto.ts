import { GetQueryDto } from '@dto/getQuery.dto';
import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsArray,
  IsOptional,
} from 'class-validator';
import { THERAPIST_LIST_TAB_TYPE, USER_STATUS } from 'src/types/enums';

export class GetTherapistListDto extends GetQueryDto {
  @ApiProperty({ enum: Object.values(THERAPIST_LIST_TAB_TYPE) })
  @IsString()
  @IsNotEmpty()
  @IsEnum(THERAPIST_LIST_TAB_TYPE)
  therapistListTabType;

  @IsOptional()
  @IsArray()
  categories?: string[];

  @IsOptional()
  @IsEnum(USER_STATUS)
  status?: USER_STATUS;
}
