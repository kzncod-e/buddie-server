/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable prettier/prettier */
import { Injectable, BadRequestException } from '@nestjs/common';
import { GoogleGenAI } from '@google/genai';
import { NoteRequest } from './note.validation';
import { PrismaService } from 'src/common/prisma.service';

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

@Injectable()
export class NoteService {
  constructor(private prisma: PrismaService) {}
  async createNote({ prompt, file, title }: NoteRequest): Promise<unknown> {
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
            { text: `${prompt}` },
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

    // ✅ Ambil teks hasil ringkasan

    const note = await this.prisma.note.create({
      data: {
        title: title ?? '',
        content: response.text,
        authorId: 1,
      },
    });
    return {
      id: Number(note.id),
      title: note.title,
      content: note.content,
    };
  }
}
