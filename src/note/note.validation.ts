/* eslint-disable prettier/prettier */

export type NoteRequest = {
  prompt?: string;

  title?: string;
  content?: string;
  authorId: number;
  file: Express.Multer.File;
};
// export type NoteResponse={}
export class NoteValidationRequest {}
