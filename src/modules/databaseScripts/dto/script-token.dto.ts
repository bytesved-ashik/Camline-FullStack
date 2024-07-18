import { IsValidObjectId } from '@decorators/valid-id.decorator';
import { IsEnum, IsNotEmpty, IsNumber, IsString } from 'class-validator';
import { DATABASE_SCRIPT_SECRET_TOKEN } from 'src/types/enums/database-script-token.enum';

export class DatabaseScriptTokenDto {
  @IsString({ message: 'Token must be string.' })
  @IsNotEmpty({ message: 'Token is required.' })
  @IsEnum(DATABASE_SCRIPT_SECRET_TOKEN, { message: 'Token is invalid.' })
  secretToken: string;
}

export class AddBalanceToUserDto extends DatabaseScriptTokenDto {
  @IsValidObjectId()
  @IsNotEmpty()
  userId: string;

  @IsNumber()
  @IsNotEmpty()
  amount: number;
}

export class VerifyEmailDto extends DatabaseScriptTokenDto {
  @IsValidObjectId()
  @IsNotEmpty()
  userId: string;
}

export class RemoveUserProfileDto extends DatabaseScriptTokenDto {
  @IsValidObjectId()
  @IsNotEmpty()
  userId: string;
}
