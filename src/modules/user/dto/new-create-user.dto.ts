import {
  IsNotEmpty,
  IsString,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  IsEmail,
  IsOptional,
} from 'class-validator';
import { ROLE } from '@enums';
import { OmitType } from '@nestjs/swagger';

@ValidatorConstraint()
export class IsRoleArray implements ValidatorConstraintInterface {
  public async validate(roleData: ROLE[]) {
    return (
      Array.isArray(roleData) &&
      roleData.every((role) => Object.values(ROLE).includes(role))
    );
  }
}

export class NewUserDetailsDto {
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @IsString()
  @IsNotEmpty()
  lastName: string;

  @IsString()
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsString()
  @IsNotEmpty()
  password: string;

  @IsString()
  @IsNotEmpty()
  status: string;

  @IsString()
  @IsOptional()
  referralCode: string;

  @IsString()
  @IsOptional()
  VATnumber?: string;
}

export class NewRegisterUserDto extends OmitType(NewUserDetailsDto, [
  'status',
] as const) {}
