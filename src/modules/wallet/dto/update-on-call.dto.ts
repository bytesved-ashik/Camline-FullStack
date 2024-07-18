import { IsNumber, Min, IsNotEmpty } from 'class-validator';
import { IsValidObjectId } from '@decorators/valid-id.decorator';

export class UpdateOnCallDto {
  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  callMinutes: number;

  @IsNotEmpty()
  @IsValidObjectId()
  therapistId: string;
}
