import {
  IsString,
  IsNotEmpty,
  IsArray,
  ArrayMinSize,
  IsEnum,
  IsNumber,
  Min,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ROLE } from '../../../types/enums/role.enum';

export class CreateQuestionDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsArray()
  @ArrayMinSize(1)
  answers: string[];

  @ApiProperty({ enum: Object.values(ROLE) })
  @IsString()
  @IsNotEmpty()
  @IsEnum(ROLE)
  role: ROLE;

  @IsNumber()
  @Min(1)
  showOrder: number;
}
