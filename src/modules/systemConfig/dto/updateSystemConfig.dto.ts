import { Type } from 'class-transformer';
import { IsNotEmptyObject, ValidateNested } from 'class-validator';
import { SystemVariablesObjectDto } from './systemVariablesObject.dto';

export class UpdateSystemConfigDto {
  @IsNotEmptyObject()
  @ValidateNested()
  @Type(() => SystemVariablesObjectDto)
  systemVariables: SystemVariablesObjectDto;
}
