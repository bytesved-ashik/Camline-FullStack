import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Notes, NotesSchema } from '@entities/notes.entity';
import { NotesController } from './notes.controller';
import { NotesService } from './notes.service';
import { NotesRepository } from '@repositories/notes.repository';
import { UserModule } from '@modules/user/user.module';

@Module({
  imports: [
    MongooseModule.forFeatureAsync([
      {
        name: Notes.name,
        useFactory: () => {
          return NotesSchema;
        },
      },
    ]),
    UserModule,
  ],
  controllers: [NotesController],
  providers: [NotesService, NotesRepository],
  exports: [NotesService, NotesRepository],
})
export class NotesModule {}
