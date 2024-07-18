import { IsString } from 'class-validator';

export class ReplyDto {
  @IsString()
  name: string;

  @IsString()
  email: string;

  @IsString()
  reply: string;
}
