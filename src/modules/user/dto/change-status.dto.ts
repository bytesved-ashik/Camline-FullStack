import { IsEnum } from 'class-validator';
import { USER_STATUS } from '@enums';

export class ChangeStatusDto {
  @IsEnum(USER_STATUS)
  status: USER_STATUS;
}
