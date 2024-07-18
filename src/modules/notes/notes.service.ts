import { Injectable } from '@nestjs/common';
import { ClientSession } from 'mongoose';
import { NotesRepository } from '@repositories/notes.repository';
import { NotesDto } from './dto/notes.dto';

@Injectable()
export class NotesService {
  constructor(private readonly notesRepository: NotesRepository) {}

  async createNotes(
    notesDto: NotesDto,
    therapistId: string,
    session: ClientSession,
  ) {
    const notes = await this.notesRepository.createNotes(
      notesDto,
      therapistId,
      session,
    );
    return notes;
  }

  async getUserWiseNotes(therapistId: string) {
    const userWiseNotes = await this.notesRepository.getUserWiseNotes(
      therapistId,
    );
    return userWiseNotes;
  }

  async getTherapistsNotes(therapistId: string, userId: string) {
    const userWiseNotes = await this.notesRepository.getTherapistsNotes(
      therapistId,
      userId,
    );

    return userWiseNotes;
  }
}
