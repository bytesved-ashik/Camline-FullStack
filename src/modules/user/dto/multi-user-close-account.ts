import { ArrayMinSize, IsArray, IsEmail } from 'class-validator';

export class MultiUserCloseAccountDto {
  @IsArray()
  @ArrayMinSize(1)
  @IsEmail({}, { each: true })
  emails: string[];
}
