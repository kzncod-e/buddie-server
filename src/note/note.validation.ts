/* eslint-disable prettier/prettier */

export type NoteRequest = {
  title: string;
  content: string;
  authorId: number;
  subject: string;
};
export type NoteResponse = {
  id: number;
  title: string;
  content: string;
};
export type EditNoteRequest = {
  id: string;
  title?: string;
  content?: string;
  subject?: string;
};
export type GenerateNoteRequest = {
  file?: Express.Multer.File;
  content?: string;
};
export type GenerateNoteResponse = {
  summary: string;
};
