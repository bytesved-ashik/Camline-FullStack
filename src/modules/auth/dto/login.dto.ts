import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { ROLE } from '@enums';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsNotEmpty()
  @IsString()
  password: string;

  @ApiProperty({ enum: Object.values(ROLE) })
  @IsString()
  @IsOptional()
  @IsEnum(ROLE)
  role?: ROLE;
}
