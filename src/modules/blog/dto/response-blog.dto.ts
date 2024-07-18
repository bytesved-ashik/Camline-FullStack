import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsString,
  IsNotEmpty,
  IsArray,
  ArrayMinSize,
  IsOptional,
  ValidateNested,
} from 'class-validator';
import { Comment } from './blog-comment.dto';

export class ResponseBlogDto {
  @IsString()
  @IsNotEmpty()
  _id: string;

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsString()
  @IsNotEmpty()
  coverPicture: string;

  @IsString()
  @IsNotEmpty()
  author: string;

  @IsArray()
  @ArrayMinSize(1)
  tags: string[];

  @ApiProperty({ type: Comment, isArray: true })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => Comment)
  comments: Comment[];

  @IsNotEmpty()
  createdAt: Date;

  @IsNotEmpty()
  updatedAt: Date;
}
