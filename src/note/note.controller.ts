/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable prettier/prettier */
import { Controller, Post, Body, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';

import { NoteService } from './note.service';

@Controller('notes')
export class NoteController {
  constructor(private readonly noteService: NoteService) {}

  @Post('generate')
  @UseInterceptors(FileInterceptor('file'))
  async generateNote(@Body('prompt') prompt?: string, @UploadedFile() file?: Express.Multer.File) {
    if(!file) throw Error('File not provided')
   prompt =
      
      `Kamu adalah asisten AI yang ahli dalam membaca dan meringkas dokumen panjang.
 Tugasmu:
1. Buat ringkasan singkat dan jelas dari dokumen berikut.
2. Sebutkan 2 poin penting atau ide utama yang paling berpengaruh dalam dokumen tersebut.

Berikan jawabannya langsung tanpa pembukaan atau penjelasan tambahan.`;

    const result = await this.noteService.createNote({prompt,file});

    return {
      success: true,
      prompt,
      result,
    };
  }
}
