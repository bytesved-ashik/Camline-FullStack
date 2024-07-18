import { IsArray, IsNotEmpty, IsString } from 'class-validator';

export class QuestionObjectDto {
  @IsArray()
  answers: string[];

  @IsNotEmpty()
  @IsString()
  question: string[];
}
