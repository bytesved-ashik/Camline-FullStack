import { IsBoolean, IsNotEmpty, IsString, ValidateIf } from 'class-validator';

export class UpdateTherapistStatusDto {
  @IsBoolean()
  @IsNotEmpty()
  isActive: boolean;
}
