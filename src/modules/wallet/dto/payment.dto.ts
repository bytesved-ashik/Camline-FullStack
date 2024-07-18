import { IsNumber, Min } from 'class-validator';
export class PaymentDto {
  @IsNumber()
  @Min(1)
  amount: number;
}
