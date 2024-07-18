import { ROLE } from '@enums';
import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsNotEmpty, IsString } from 'class-validator';

export class CreateInterestDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @ApiProperty({ enum: [ROLE.USER, ROLE.THERAPIST] })
  @IsString()
  @IsNotEmpty()
  @IsEnum([ROLE.USER, ROLE.THERAPIST])
  role: ROLE;
}
