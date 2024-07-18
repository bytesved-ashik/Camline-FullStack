import { InjectModel } from '@nestjs/mongoose';
import { ShortlistedTherapists } from '@entities/shortlistedTherapist.entity';
import { IShortlistedTherapistsModel } from 'src/types/interfaces/entities/shortlistedTherapists.interface';
import { UserService } from '@modules/user/user.service';
import { BadRequestException } from '@nestjs/common';
import { ROLE } from 'src/types/enums';
import { ChatService } from '@modules/chats/chat.service';

export class ShortlistedTherapistRepository {
  constructor(
    @InjectModel(ShortlistedTherapists.name)
    private readonly shortlistedTherapistModel: IShortlistedTherapistsModel,
    private readonly userService: UserService,
    private readonly chatService: ChatService,
  ) {}

  async createShortlistTherapist(userId: string, therapistId: string) {
    const therapist = await this.userService.getUserById(therapistId);

    if (!therapist || !therapist.roles.includes(ROLE.THERAPIST)) {
      throw new BadRequestException('Therapist does not exists.');
    }

    let shortlist = await this.isAlreadyShortlisted(userId, therapistId);

    if (!shortlist) {
      shortlist = await this.shortlistedTherapistModel.create({
        userId,
        therapistId,
      });
    }

    await this.chatService.createChat(userId, therapistId);

    return shortlist;
  }

  async isAlreadyShortlisted(userId: string, therapistId: string) {
    const shortlist = await this.shortlistedTherapistModel.findOne({
      userId,
      therapistId,
    });

    return shortlist;
  }

  async getShortlistedTherapists(userId: string) {
    const shortlist = await this.shortlistedTherapistModel.find({
      userId: userId,
    });

    return shortlist;
  }
}
