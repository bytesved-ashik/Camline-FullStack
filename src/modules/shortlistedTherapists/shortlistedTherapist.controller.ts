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
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { Response } from 'express';
import { IRequest } from '@interfaces';
import { JwtAuthGuard } from '@classes/jwt-auth.guard';
import { CreateShortlistTherapistDto } from './dto/create-shortlist-therapist.dto';
import { ShortlistedTherapistService } from './shortlistedTherapist.service';

@ApiTags('ShortlistedTherapists')
@Controller('users/shortlistedTherapists')
export class ShortlistedTherapistsController {
  constructor(
    private readonly shortlistedTherapistService: ShortlistedTherapistService,
    @InjectConnection() private readonly mongoConnection: Connection,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  @ApiOperation({
    description: 'Add therapists to shortlist',
  })
  async create(
    @Body() createShortlistTherapistDto: CreateShortlistTherapistDto,
    @Res() res: Response,
    @Req() req: IRequest,
  ) {
    const session = await this.mongoConnection.startSession();
    session.startTransaction();
    try {
      const { therapistId } = createShortlistTherapistDto;

      const shortlist =
        await this.shortlistedTherapistService.createShortlistTherapist(
          req.user._id,
          therapistId,
        );
      await session.commitTransaction();
      return res.status(HttpStatus.CREATED).send({
        shortlist: shortlist,
      });
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }
}
