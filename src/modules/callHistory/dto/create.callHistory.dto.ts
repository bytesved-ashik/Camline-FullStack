import { IsNumber, IsNotEmpty } from 'class-validator';
import { IsValidObjectId } from '@decorators/valid-id.decorator';
import { Wallet } from '@entities/wallet.entity';
import { Type } from 'class-transformer';

export class CreateCallHistoryDto {
  @IsValidObjectId()
  @IsNotEmpty()
  userId: string;

  @IsValidObjectId()
  @IsNotEmpty()
  therapistId: string;

  @IsNotEmpty()
  @IsNumber()
  callMinutes: number;

  @IsNotEmpty()
  @Type(() => Wallet)
  previosWallet: Wallet;

  @IsNotEmpty()
  @Type(() => Wallet)
  currentWallet: Wallet;
}
