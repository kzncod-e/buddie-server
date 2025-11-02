/* eslint-disable prettier/prettier */

export type NoteRequest = {
  title: string;
  content: string;
  authorId: number;
};
export type NoteResponse = {
  id: number;
  title: string;
  content: string;
};
export type GenerateNoteRequest = {
  file: Express.Multer.File;
};
export type GenerateNoteResponse = {
  summary: string;
};
