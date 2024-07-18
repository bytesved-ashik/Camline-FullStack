import { IsNumber, Min, IsString, IsNotEmpty, IsEnum } from 'class-validator';
import { TRANSACTION_TYPE, TRANSACTION_STATUS } from '@enums';
import { IsValidObjectId } from '@decorators/valid-id.decorator';
export class TransactionDto {
  @IsNumber()
  @Min(1)
  amount: number;

  @IsEnum(TRANSACTION_TYPE)
  @IsNotEmpty()
  type: string;

  @IsEnum(TRANSACTION_STATUS)
  @IsNotEmpty()
  status: string;

  @IsString()
  @IsNotEmpty()
  @IsValidObjectId()
  user: string;

  @IsString()
  @IsNotEmpty()
  remarks: string;
}
