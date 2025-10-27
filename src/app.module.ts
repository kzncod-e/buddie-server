/* eslint-disable prettier/prettier */
import { Module } from '@nestjs/common';

import { NoteModule } from './note/note.module';
import { PrismaModule } from './common/prisma.module';

@Module({
  imports: [NoteModule, PrismaModule],
})
export class AppModule {}
