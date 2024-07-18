import {
  IsNotEmpty,
  IsString,
  IsArray,
  ArrayMinSize,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  IsEmail,
  ValidateNested,
  IsOptional,
  IsEnum,
} from 'class-validator';
import { ROLE } from '@enums';
import { GENDER } from 'src/types/enums';
import { OmitType } from '@nestjs/swagger';
import {
  IsValidObjectId,
  IsValidObjectIdArray,
} from '@decorators/valid-id.decorator';
import { IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';

@ValidatorConstraint()
export class IsRoleArray implements ValidatorConstraintInterface {
  public async validate(roleData: ROLE[]) {
    return (
      Array.isArray(roleData) &&
      roleData.every((role) => Object.values(ROLE).includes(role))
    );
  }
}

export class UserDetailsDto {
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

  @IsOptional()
  @IsString()
  address?: string;

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  language: string;

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  country: string;

  @IsString()
  @IsNotEmpty()
  status: string;

  @IsString()
  @IsOptional()
  referralCode: string;

  @IsString()
  @IsOptional()
  @IsEnum(GENDER)
  gender: GENDER;

  @IsOptional()
  @IsString()
  bio: string;
}

export class UserProfileDto extends UserDetailsDto {
  @IsArray()
  @ArrayMinSize(1)
  @IsValidObjectIdArray()
  categories: string[];

  @IsValidObjectId()
  @IsOptional()
  profilePicture: string;

  @IsNumber()
  @Min(1)
  @IsOptional()
  budget: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => Object)
  @IsOptional()
  questions: Record<string, unknown>[];

  @IsString()
  @IsOptional()
  phoneNumber: string;
}

export class CreateUserDto extends UserProfileDto {}

export class RegisterUserDto extends OmitType(CreateUserDto, [
  'status',
] as const) {}
