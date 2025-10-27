/* eslint-disable prettier/prettier */

export type NoteRequest={
    prompt?:string
     file:Express.Multer.File
    title?:string
    content?:string
}