import {
  IsArray,
  ArrayMinSize,
  ValidateNested,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsNotEmptyObject,
} from 'class-validator';
import {
  IsValidObjectId,
  IsValidObjectIdArray,
} from '@decorators/valid-id.decorator';
import { IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { MediaObjectDto } from './media.dto';
import { CreateAvailabilityDto } from '@modules/availability/dto/create-availability.dto';

export class UpdateTherapistDetailsDto {
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @IsString()
  @IsNotEmpty()
  lastName: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsString()
  @IsNotEmpty()
  language: string;

  @IsString()
  @IsNotEmpty()
  country: string;
}

export class UpdateTherapistDto extends UpdateTherapistDetailsDto {
  @IsArray()
  @ArrayMinSize(1)
  @IsValidObjectIdArray()
  categories: string[];

  @IsOptional()
  @IsString()
  bio: string;

  @IsNumber()
  @Min(1)
  perSessionPrice: number;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => MediaObjectDto)
  medias: MediaObjectDto[];

  @IsValidObjectId()
  @IsNotEmpty()
  profilePicture: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => Object)
  questions: Record<string, unknown>[];

  @IsNotEmptyObject()
  @ValidateNested({ each: true })
  @Type(() => CreateAvailabilityDto)
  therapistAvailability: CreateAvailabilityDto;
}
