import { DEFAULT_PAGE, DEFAULT_SORT, LIMIT_PER_PAGE } from '@constants/index';
import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsDate,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
} from 'class-validator';

export class PaginateQueryDto {
  /**
   * Example: createdAt:desc,updatedAt:asc
   */
  @IsOptional()
  @IsString()
  sort?: string = DEFAULT_SORT;

  @Transform(({ value }) => parseInt(value, 10))
  @IsOptional()
  @IsNumber()
  @IsPositive()
  limit?: number = LIMIT_PER_PAGE;

  @Transform(({ value }) => parseInt(value, 10))
  @IsOptional()
  @IsNumber()
  @IsPositive()
  page?: number = DEFAULT_PAGE;

  @Transform(({ value }) => {
    if (value === 'false') return false;
    if (value === 'true') return true;
  })
  @IsOptional()
  @IsBoolean()
  pagination?: boolean = true;
}

export class GetQueryDto extends PaginateQueryDto {
  @IsOptional()
  @IsString()
  q?: string;

  @IsOptional()
  @Transform(({ value }) => new Date(value))
  @IsDate()
  startDate: Date;

  @IsOptional()
  @Transform(({ value }) => new Date(value))
  @IsDate()
  endDate: Date;
}
