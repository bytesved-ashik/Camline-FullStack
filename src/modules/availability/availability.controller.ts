import {
  Controller,
  Post,
  Body,
  HttpStatus,
  Res,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AvailabilityService } from './availability.service';
import { CreateAvailabilityDto } from './dto/create-availability.dto';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { Response } from 'express';
import { IRequest } from '@interfaces';
import { JwtAuthGuard } from '@classes/jwt-auth.guard';

@ApiTags('Availability')
@Controller('availability')
export class AvailabilityController {
  constructor(
    private readonly availabilityService: AvailabilityService,
    @InjectConnection() private readonly mongoConnection: Connection,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  @ApiOperation({
    description: 'Add weekly availability of therapists',
  })
  async create(
    @Body() createAvailabilityDto: CreateAvailabilityDto,
    @Res() res: Response,
    @Req() req: IRequest,
  ) {
    const session = await this.mongoConnection.startSession();
    session.startTransaction();
    try {
      const availability = await this.availabilityService.createAvailability(
        req.user,
        createAvailabilityDto,
      );
      await session.commitTransaction();
      return res.status(HttpStatus.CREATED).send({
        availability: availability,
      });
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }
}
