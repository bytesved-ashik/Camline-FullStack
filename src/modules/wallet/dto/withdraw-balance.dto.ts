import { IsNumber, Min, IsNotEmpty } from 'class-validator';

export class WithdrawWalletBalanceDto {
  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  amount: number;
}
