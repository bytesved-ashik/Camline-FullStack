import { Type } from 'class-transformer';
import { IsArray, IsString, ValidateNested } from 'class-validator';
import { ReplyDto } from './blog-comment-reply.dto';

export class Comment {
  @IsString()
  name: string;

  @IsString()
  email: string;

  @IsString()
  comment: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReplyDto)
  replies: ReplyDto[];
}
