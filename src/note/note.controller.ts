/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable prettier/prettier */
import {
  Controller,
  Post,
  Body,
  UseInterceptors,
  Get,
  Put,
  Delete,
  UploadedFile,
  UseGuards,
  Req,
  UnauthorizedException,
  Param,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';

import { NoteService } from './note.service';
import * as noteValidation from './note.validation';
import { WebResponse } from 'src/user/user.validation';
import { Note } from '@prisma/client';
import { AuthGuard } from 'src/guard/auth.guard';

@Controller()
export class NoteController {
  constructor(private readonly noteService: NoteService) {}

  @UseGuards(AuthGuard)
  @Get('/api/note/author')
  async getNotesByAuthor(
    @Req() request: Request & { user?: { id?: number } },
  ): Promise<WebResponse<Note[]>> {
    const user = request?.user;
    const authorId = user?.id;
    if (!authorId) throw new UnauthorizedException('User ID not found');
    const result = await this.noteService.getNotesByAuthor({
      authorId: String(authorId),
    });
    return {
      data: result,
      message: 'Notes retrieved successfully',
    };
  }
  @Get('/api/note/:slug')
  async getNoteBySlug(@Param('slug') slug: string): Promise<WebResponse<Note>> {
    const result = await this.noteService.getNoteBySlug({ slug });
    return {
      data: result!,
      message: 'Note retrieved successfully',
    };
  }
  @Delete('/api/note')
  async deleteNote(
    @Body() request: { id: string },
  ): Promise<WebResponse<Note>> {
    const result = await this.noteService.deleteNoteById(request);
    return {
      data: result,
      message: 'Note deleted successfully',
    };
  }
  @Put('/api/note')
  async updateNote(
    @Body() request: noteValidation.EditNoteRequest,
  ): Promise<WebResponse<Note>> {
    const result = await this.noteService.updateNoteById(request);
    return {
      data: result,
      message: 'Note updated successfully',
    };
  }
  @Post('/api/note')
  async createNote(
    @Body() request: noteValidation.NoteRequest,
  ): Promise<WebResponse<noteValidation.NoteResponse>> {
    const result = await this.noteService.createNote(request);
    return {
      data: result,
      message: 'Note created successfully',
    };
  }
  @Post('/api/note/summarize')
  @UseInterceptors(FileInterceptor('file'))
  async summarizeNote(
    @UploadedFile() file: Express.Multer.File,
    @Body() request: noteValidation.GenerateNoteRequest,
  ): Promise<WebResponse<noteValidation.GenerateNoteResponse>> {
    const result = await this.noteService.sumarizeNote({
      file,
      content: request.content,
    });
    return {
      data: result,
      message: 'Note summarized successfully',
    };
  }
}
