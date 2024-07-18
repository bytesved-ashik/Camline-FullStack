import {
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ClientSession, Types } from 'mongoose';
import { Notes } from '@entities/notes.entity';
import { INotesModel } from 'src/types/interfaces/entities/notes.interface';
import { NotesDto } from '@modules/notes/dto/notes.dto';
import { UserRepository } from './user.repository';
import { createCipheriv, createDecipheriv } from 'crypto';
import { IV, KEY } from '@modules/notes/notes.constant';
import { ROLE } from 'src/types/enums';

export class NotesRepository {
  constructor(
    private readonly userRepository: UserRepository,
    @InjectModel(Notes.name) private readonly notesModel: INotesModel,
  ) {}

  async createNotes(
    notesDto: NotesDto,
    therapistId: string,
    session: ClientSession,
  ) {
    try {
      const userId = notesDto.userId;

      const getUser = await this.userRepository.getUserById(userId);
      if (!getUser || !getUser.roles.includes(ROLE.USER)) {
        throw new BadRequestException({
          message: 'User not found',
        });
      }

      const encryptNotes = await this.encrypt(notesDto.notes);

      let saveNotes = new this.notesModel({
        userId: userId,
        therapistId: therapistId,
        notes: encryptNotes,
        sessionId: notesDto.sessionId,
      });

      saveNotes = await saveNotes.save({ session });

      return saveNotes;
    } catch (error) {
      throw new InternalServerErrorException(error);
    }
  }

  // Encrypt text
  async encrypt(encryptNotes) {
    const iv = Buffer.from(IV, 'hex');
    const key = Buffer.from(KEY, 'hex');

    const cipher = createCipheriv('aes-256-ctr', key, iv);

    const encryptedText = Buffer.concat([
      cipher.update(encryptNotes),
      cipher.final(),
    ]);
    const stringNotes = encryptedText.toString('hex');
    return stringNotes;
  }

  // Decrypting text
  async decrypt(encryptNotes) {
    const iv = Buffer.from(IV, 'hex');
    const key = Buffer.from(KEY, 'hex');
    const notes = Buffer.from(encryptNotes, 'hex');

    const decipher = createDecipheriv('aes-256-ctr', key, iv);
    const decryptedText = Buffer.concat([
      decipher.update(notes),
      decipher.final(),
    ]);
    return decryptedText.toString();
  }

  async getUsersNotes(userId: string) {
    const usersNotes = await this.notesModel
      .find({
        userId: userId,
      })
      .populate('therapistId');

    usersNotes.map(async (note) => {
      const decryptNotes = await this.decrypt(note.notes);
      note.notes = decryptNotes;

      return note;
    });

    return usersNotes;
  }

  async getUserWiseNotes(therapistId: string) {
    const userWiseNotes = await this.notesModel.aggregate([
      {
        $match: { therapistId: new Types.ObjectId(therapistId) },
      },
      {
        $group: {
          _id: '$userId',
          userId: {
            $first: '$userId',
          },
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'user',
        },
      },
      {
        $unwind: {
          path: '$user',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: 'userprofiles',
          localField: '_id',
          foreignField: 'user',
          as: 'profile',
        },
      },
      {
        $unwind: {
          path: '$profile',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $unset: 'user.password',
      },
      {
        $lookup: {
          from: 'media',
          localField: 'profile.profilePicture',
          foreignField: '_id',
          as: 'profilePicture',
        },
      },
      {
        $unwind: {
          path: '$profilePicture',
          preserveNullAndEmptyArrays: true,
        },
      },
    ]);

    return userWiseNotes;
  }

  async getTherapistsNotes(therapistId: string, userId: string) {
    const sessionWiseNotes = await this.notesModel.aggregate([
      {
        $match: {
          therapistId: new Types.ObjectId(therapistId),
          userId: new Types.ObjectId(userId),
        },
      },
      {
        $group: {
          _id: '$sessionId',
          sessionId: {
            $first: '$sessionId',
          },
          notes: {
            $push: '$$ROOT',
          },
        },
      },
      {
        $lookup: {
          from: 'sessions',
          localField: 'sessionId',
          foreignField: '_id',
          as: 'session',
        },
      },
      {
        $unwind: {
          path: '$session',
          preserveNullAndEmptyArrays: true,
        },
      },
    ]);

    for (let i = 0; i < sessionWiseNotes.length; i++) {
      const notes = sessionWiseNotes[i].notes;
      notes.map(async (note) => {
        const decryptNotes = await this.decrypt(note.notes);
        note.notes = decryptNotes;

        return note;
      });
    }

    return sessionWiseNotes;
  }
}
