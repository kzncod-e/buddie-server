/* eslint-disable prettier/prettier */
import { Module } from '@nestjs/common';

import { NoteModule } from './note/note.module';
import { CommonModule } from './common/common.module';
import { UserModule } from './user/user.module';

@Module({
  imports: [NoteModule, CommonModule, UserModule],
})
export class AppModule {}
