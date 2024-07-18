import {
  IsArray,
  ArrayMinSize,
  IsOptional,
  IsString,
  ValidateNested,
  IsNotEmpty,
  IsNumber,
  IsPositive,
} from 'class-validator';
import { OmitType } from '@nestjs/swagger';
import {
  IsValidObjectId,
  IsValidObjectIdArray,
} from '@decorators/valid-id.decorator';
import { UserDetailsDto } from './create-user.dto';
import { Type } from 'class-transformer';
import { MediaObjectDto } from './media.dto';

export class TherapistProfileDto extends UserDetailsDto {
  @IsArray()
  @ArrayMinSize(1)
  @IsValidObjectIdArray()
  categories: string[];

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => MediaObjectDto)
  medias: MediaObjectDto[];

  @IsValidObjectId()
  @IsNotEmpty()
  profilePicture: string;

  @IsOptional()
  @IsString()
  VATNumber: string;

  @IsString()
  @IsOptional()
  // @IsNotEmpty()
  phoneNumber: string;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  perHourCharge;
}

export class CreateTherapistDto extends TherapistProfileDto {}

export class RegisterTherapistDto extends OmitType(CreateTherapistDto, [
  'status',
] as const) {}
