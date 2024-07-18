import { IsNotEmpty, IsNumber } from 'class-validator';

export class SystemVariablesObjectDto {
  @IsNotEmpty()
  @IsNumber()
  CALL_CHARGE_PER_MINUTE;
}
