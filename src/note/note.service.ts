/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable prettier/prettier */
import { Injectable, NotFoundException } from '@nestjs/common';
import { GoogleGenAI } from '@google/genai';
import {
  EditNoteRequest,
  GenerateNoteRequest,
  GenerateNoteResponse,
  NoteRequest,
  NoteResponse,
} from './note.validation';
import { PrismaService } from 'src/common/prisma.service';
import { Note } from '@prisma/client';

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

@Injectable()
export class NoteService {
  constructor(private prisma: PrismaService) {}
  async getNotesByAuthor({ authorId }: { authorId: string }): Promise<Note[]> {
    const notes = await this.prisma.note.findMany({
      where: { authorId: Number(authorId) },
    });
    return notes;
  }

  async getNoteBySlug({ slug }: { slug: string }): Promise<Note | null> {
    const note = await this.prisma.note.findFirst({
      where: { slug: slug ?? '' },
    });
    if (!note) {
      throw new Error('Note with this slug not found');
    }
    return note;
  }

  async deleteNoteById({ id }: { id: string }): Promise<Note> {
    try {
      return await this.prisma.note.delete({ where: { id: Number(id) } });
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException(`Note dengan id ${id} tidak ditemukan`);
      }
      throw error;
    }
  }

  async updateNoteById({
    id,
    title,
    content,
    subject,
  }: EditNoteRequest): Promise<Note> {
    return this.prisma.note.update({
      where: { id: Number(id) },
      data: {
        title,
        content,
        subject,
      },
    });
  }
  async createNote({
    content,
    title,
    authorId,
  }: NoteRequest): Promise<NoteResponse> {
    // ✅ Generate slug dari title
    const slug = title
      ? title
          .toLowerCase()
          .trim()
          .replace(/[^\w\s-]/g, '') // hapus karakter aneh
          .replace(/\s+/g, '-') // ganti spasi jadi "-"
      : `note-${Date.now()}`; // fallback kalau title kosong

    // ✅ Simpan ke database
    const note = await this.prisma.note.create({
      data: {
        title: title ?? '',
        content: content ?? '',
        authorId:Number(authorId),
        slug, // simpan slug-nya
      },
    });

    return {
      id: Number(note.id),
      title: note.title,
      content: note.content || '',
    };
  }
  async sumarizeNote(
    request: GenerateNoteRequest,
  ): Promise<GenerateNoteResponse> {
    const { file, content } = request;
    let data: string;
    if (file) {
      data = file.buffer.toString('base64');
    } else {
      data = Buffer.from(content || '', 'utf-8').toString('base64');
    }
    if (!data || data.trim() === '') {
      throw new Error(
        'No data provided to Gemini. Please upload a file or provide text content.',
      );
    }

    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: `Kamu adalah asisten AI yang ahli dalam memahami dan meringkas dokumen panjang secara mendalam. 
Tugasmu: Buat ringkasan komprehensif sepanjang 3–4 paragraf yang menyampaikan inti dan alur utama dokumen dengan bahasa yang jelas dan terstruktur. 
Setelah ringkasan, tuliskan dua poin paling berpengaruh atau ide utama yang menjadi inti pemikiran atau pesan penting dari dokumen tersebut. 
Berikan jawaban langsung tanpa pembukaan, penjelasan tambahan, atau format daftar di luar dua poin utama di akhir. Gunakan gaya bahasa alami dan tetap formal.`,
            },
            {
              inlineData: {
                mimeType: file?.mimetype || 'text/plain',
                data,
              },
            },
          ],
        },
      ],
    });

    const summary =
      response.text ||
      response.candidates?.[0]?.content?.parts?.[0]?.text ||
      '';

    return { summary };
  }
}
