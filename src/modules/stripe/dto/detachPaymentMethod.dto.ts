import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class DetachPaymentMethodDto {
  @ApiProperty({ description: 'Stripe Payment method id' })
  @IsString()
  @IsNotEmpty()
  paymentMethodId: string;
}
