/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable prettier/prettier */
import { Controller, Post, Body, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';

import { NoteService } from './note.service';
import * as noteValidation from './note.validation';
import { WebResponse } from 'src/user/user.validation';

@Controller()
export class NoteController {
  constructor(private readonly noteService: NoteService) {}
  @Post('/api/note')
  async createNote(
    @Body() request: noteValidation.NoteRequest,
  ): Promise<WebResponse<noteValidation.NoteResponse>> {
    const result = await this.noteService.createNote(request);
    return {
      data: result,
    };
  }
  @Post('/api/note/summarize')
  @UseInterceptors(FileInterceptor('file'))
  async summarizeNote(
    @Body() request: noteValidation.GenerateNoteRequest,
  ): Promise<WebResponse<noteValidation.GenerateNoteResponse>> {
    const result = await this.noteService.sumarizeNote(request);
    return {
      data: result,
    };
  }
}
