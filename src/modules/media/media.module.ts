import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Media, MediaSchema } from '@entities/media.entity';
import * as paginate from 'mongoose-paginate-v2';
import * as soft_delete from 'mongoose-delete';
import { MediaRepository } from '@repositories/media.repository';
import { MediaController } from './media.controller';
import { MediaService } from './media.service';
import { IMediaDocument } from 'src/types/interfaces';
import toJSON from '@entities/plugins/toJSON.plugin';

@Module({
  imports: [
    MongooseModule.forFeatureAsync([
      {
        name: Media.name,
        useFactory: () => {
          MediaSchema.method(
            'isMediaofUser',
            async function (userId): Promise<boolean> {
              const media: IMediaDocument = await this;
              return media.user._id.toHexString() === userId;
            },
          );

          MediaSchema.plugin(paginate);
          MediaSchema.plugin(soft_delete, {
            deletedBy: true,
            deletedAt: true,
            overrideMethods: 'all',
          });
          MediaSchema.plugin(toJSON);

          return MediaSchema;
        },
      },
    ]),
  ],
  controllers: [MediaController],
  providers: [MediaService, MediaRepository],
  exports: [MediaService, MediaRepository],
})
export class MediaModule {}
