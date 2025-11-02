/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable prettier/prettier */
import { Injectable, BadRequestException } from '@nestjs/common';
import { GoogleGenAI } from '@google/genai';
import {
  GenerateNoteRequest,
  GenerateNoteResponse,
  NoteRequest,
  NoteResponse,
} from './note.validation';
import { PrismaService } from 'src/common/prisma.service';

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

@Injectable()
export class NoteService {
  constructor(private prisma: PrismaService) {}

  async createNote({
    content,
    title,
    authorId,
  }: NoteRequest): Promise<NoteResponse> {
    // ✅ Ambil teks hasil ringkasan

    const note = await this.prisma.note.create({
      data: {
        title: title ?? '',
        content: content ?? '',
        authorId: authorId,
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
    const { file } = request;
    if (!file) throw new BadRequestException('File not found');
    if (file.mimetype !== 'application/pdf') {
      throw new BadRequestException('Only PDF files are supported');
    }

    // ✅ Konversi buffer PDF ke base64
    const base64PDF = file.buffer.toString('base64');

    // ✅ Kirim ke Gemini pakai inlineData (PDF dibaca langsung oleh AI)
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: `Kamu adalah asisten AI yang ahli dalam memahami dan meringkas dokumen panjang secara mendalam. Tugasmu:
Buat ringkasan komprehensif sepanjang 3–4 paragraf yang menyampaikan inti dan alur utama dokumen dengan bahasa yang jelas dan terstruktur.
Setelah ringkasan, tuliskan dua poin paling berpengaruh atau ide utama yang menjadi inti pemikiran atau pesan penting dari dokumen tersebut.
Berikan jawaban langsung tanpa pembukaan, penjelasan tambahan, atau format daftar di luar dua poin utama di akhir. Gunakan gaya bahasa alami dan tetap formal.`,
            },
            {
              inlineData: {
                mimeType: 'application/pdf',
                data: base64PDF,
              },
            },
          ],
        },
      ],
    });
    return {
      summary: response.text || '',
    };
  }
}
