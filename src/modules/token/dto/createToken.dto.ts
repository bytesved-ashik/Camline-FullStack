import { IsNotEmpty, IsObject, IsOptional, IsString } from 'class-validator';
import { ROLE, TOKEN_TYPE } from '@enums';

export class CreateTokenDto {
  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsString()
  @IsNotEmpty()
  token: string;

  @IsString()
  @IsNotEmpty()
  tokenType: TOKEN_TYPE;

  @IsObject()
  @IsOptional()
  extraData?: {
    VATnumber: string;
    roles: ROLE[];
  };
}
