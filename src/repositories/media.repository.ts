import { IMediaDocument, IMediaModel } from '@interfaces';
import { Injectable } from '@nestjs/common';
import { CreateMediaDto } from '@modules/media/dto/createMedia.dto';
import { Media } from '@entities/media.entity';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, PaginateOptions, PaginateResult, Types } from 'mongoose';

@Injectable()
export class MediaRepository {
  constructor(
    @InjectModel(Media.name) private readonly mediaModel: IMediaModel,
  ) {}

  async createBulk(medias: CreateMediaDto[]): Promise<IMediaDocument[]> {
    return this.mediaModel.create(medias);
  }

  async getMediaOfUser(
    userId: string,
    medias: string[],
  ): Promise<IMediaDocument[]> {
    return await this.mediaModel.aggregate().match({
      user: new Types.ObjectId(userId),
      _id: { $in: medias.map((m) => new Types.ObjectId(m)) },
    });
  }

  async getMediaById(id: string) {
    const media: IMediaDocument = await this.mediaModel.findById(id);
    return media;
  }
  async getAllMedias(
    filter: FilterQuery<IMediaDocument>,
    options: PaginateOptions,
  ) {
    const medias: PaginateResult<IMediaDocument> =
      await this.mediaModel.paginate(filter, options);
    return medias;
  }
}
