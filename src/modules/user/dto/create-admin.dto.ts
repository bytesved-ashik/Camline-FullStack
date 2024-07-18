import {
  IsNotEmpty,
  IsString,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  IsEmail,
  IsEnum,
} from 'class-validator';
import { GENDER, ROLE } from '@enums';

@ValidatorConstraint()
export class IsRoleArray implements ValidatorConstraintInterface {
  public async validate(roleData: ROLE[]) {
    return (
      Array.isArray(roleData) &&
      roleData.every((role) => Object.values(ROLE).includes(role))
    );
  }
}

export class CreateAdminDto {
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
  @IsEnum(GENDER)
  gender: GENDER;
}
