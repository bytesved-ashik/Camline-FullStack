import { ApiProperty } from '@nestjs/swagger';

export class MediaUploadDto {
  @ApiProperty({ type: 'string', isArray: true, format: 'binary' })
  'files[]': any[];
}
