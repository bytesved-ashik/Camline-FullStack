import { Roles } from '@decorators/role.decorator';
import {
  BadRequestException,
  Body,
  Controller,
  HttpStatus,
  Post,
  Res,
  Req,
  UseGuards,
  Get,
} from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Response } from 'express';
import { Connection } from 'mongoose';
import { ROLE } from '@enums';
import { NotesDto } from './dto/notes.dto';
import { NotesService } from './notes.service';
import { JwtAuthGuard } from '@classes/jwt-auth.guard';
import { RolesGuard } from '@classes/role.guard';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { IRequest } from 'src/types/interfaces';
import { GetSingleUsersNotesDto } from './dto/get-single-users-notes.dto';

@ApiTags('Notes')
@ApiBearerAuth()
@Controller('notes')
export class NotesController {
  constructor(
    @InjectConnection() private readonly mongoConnection: Connection,
    private notesService: NotesService,
  ) {}

  @Roles(ROLE.THERAPIST)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Post('/')
  @ApiOperation({
    description: 'Create a new note',
  })
  async createNotes(
    @Body() notesDto: NotesDto,
    @Req() req: IRequest,
    @Res() res: Response,
  ) {
    const session = await this.mongoConnection.startSession();
    session.startTransaction();
    try {
      const therapist = req.user;
      const newNotes: any = await this.notesService.createNotes(
        notesDto,
        therapist._id,
        session,
      );
      await session.commitTransaction();
      return res.status(HttpStatus.CREATED).send(newNotes);
    } catch (error) {
      await session.abortTransaction();
      throw new BadRequestException(error);
    } finally {
      session.endSession();
    }
  }

  @Roles(ROLE.THERAPIST)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get('/get-userwise')
  @ApiOperation({
    description: 'Get userwise notes',
  })
  async getUserWiseNotes(@Req() req: IRequest) {
    const therapist = req.user;

    const userWiseNotes = await this.notesService.getUserWiseNotes(
      therapist._id.toHexString(),
    );

    return userWiseNotes;
  }

  @Roles(ROLE.THERAPIST)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Post('/get-single-users-notes')
  @ApiOperation({
    description: 'Get single users notes created by particular therapist',
  })
  async getTherapistsNotes(
    @Req() req: IRequest,
    @Body() body: GetSingleUsersNotesDto,
  ) {
    const therapist = req.user;
    const userId = body.userId;

    const userWiseNotes = await this.notesService.getTherapistsNotes(
      therapist._id.toHexString(),
      userId,
    );

    return userWiseNotes;
  }
}
