import { IsString } from 'class-validator';
import { TherapistProfileDto } from './create-therapist.dto';

export class UpdateTherapistProfileDto extends TherapistProfileDto {
  @IsString()
  deductionPercentage: string;
}
