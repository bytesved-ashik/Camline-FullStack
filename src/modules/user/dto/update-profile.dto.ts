import {
  IsValidObjectId,
  IsValidObjectIdArray,
} from '@decorators/valid-id.decorator';
import {
  IsISO4217CurrencyCode,
  IsNotEmpty,
  IsOptional,
  IsPhoneNumber,
  IsString,
  IsArray,
  ArrayMinSize,
  ValidateNested,
  ArrayUnique,
  IsEnum,
  IsNumber,
  IsPositive,
} from 'class-validator';
import { MediaObjectDto } from './media.dto';
import { Type } from 'class-transformer';
import { CreateAvailabilityDto } from '@modules/availability/dto/create-availability.dto';
import { QuestionObjectDto } from './question.dto';
import { GENDER } from 'src/types/enums';

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  firstName?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  lastName?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  language?: string;

  @IsOptional()
  @IsString()
  country?: string;

  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @IsOptional()
  @IsValidObjectId()
  profilePicture: string;

  @IsOptional()
  @IsString()
  state?: string;

  @IsOptional()
  @IsString()
  zipCode?: string;

  @IsOptional()
  @IsString()
  @IsISO4217CurrencyCode()
  currency = 'USD';

  @IsOptional()
  @IsString()
  bio: string;

  @IsValidObjectId()
  @IsOptional()
  userId: string;

  @IsString()
  @IsOptional()
  @IsEnum(GENDER)
  gender: GENDER;
}

export class UpdateTherapistProfileDto extends UpdateProfileDto {
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @IsValidObjectIdArray()
  categories: string[];

  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => MediaObjectDto)
  medias: MediaObjectDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @ArrayUnique((obj: QuestionObjectDto) => obj.question)
  @Type(() => QuestionObjectDto)
  questions: QuestionObjectDto[];

  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => CreateAvailabilityDto)
  therapistAvailability: CreateAvailabilityDto;

  @IsOptional()
  @IsString()
  VATNumber: string;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  perHourCharge;
}
