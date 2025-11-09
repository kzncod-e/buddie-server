/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable prettier/prettier */
import {
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { GoogleGenAI } from '@google/genai';
import {
  EditNoteRequest,
  generateContentRequest,
  GenerateNoteRequest,
  GenerateNoteResponse,
  NoteRequest,
  NoteResponse,
} from './note.validation';
import { PrismaService } from 'src/common/prisma.service';
import { Note } from '@prisma/client';
import { fork } from 'child_process';

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

  async getNoteBySlug({ slug }: { slug: string }): Promise<Note> {
    const note = await this.prisma.note.findFirst({
      where: { slug: slug ?? '' },
    });
    if (!note) {
      throw new NotFoundException('Note with this slug not found');
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
    subject,
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
        subject: subject ?? '',
        content: content ?? '',
        authorId: Number(authorId),
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
      throw new NotFoundException(
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
  async generateContentAI({
    platform,
    topic,
    contentFormat,
    subTopic,
  }: generateContentRequest): Promise<GenerateNoteResponse> {
    if (!platform || !topic || !contentFormat) {
      throw new HttpException(
        'Please provide platform, topic, and content format.',
        HttpStatus.BAD_REQUEST,
      );
    }
    const prompt = `
You are an advanced AI assistant integrated inside an English content creation app called "StudyBuddie.AI".

Your role is to generate complete, structured, and platform-ready content ideas based on the user's input.

Parameters:
- topic: "${topic}"
- subtopic: "${subTopic}"
- platform: "${platform}"
- slideType: "${contentFormat}"

Important rules:
1. Output must be **pure valid JSON only** — do NOT include markdown, code blocks, or extra text.
2. Do NOT include any wrapper like 'raw' or 'summary'.
3. Follow this exact JSON schema:

{
  "topic": "string",
  "subtopic": "string",
  "platform": "string",
  "slideType": "string | null",
  "idea": {
    "title": "string",
    "description": "string",
    "keyPoints": ["string"]
  },
  "content": {
    "hook": "string",
    "body": "string",
    "slides": [{"slideNumber": number, "headline": "string", "text": "string"}],
    "caption": "string",
    "cta": "string"
  },
  "metadata": {
    "tone": "string",
    "targetAudience": "string",
    "writingStyle": "string",
    "suggestedHashtags": ["string"]
  }
}

Rules:
1. Write in English.
- If slideType is "multi-slide", generate 3–6 slides with numbered order.
- If slideType is "one-slide", include only 1 slide object in the "slides" array and keep the body concise.
2. Adapt tone and style based on the platform:
   - LinkedIn → professional and informative
   - Instagram → casual and engaging
   - Twitter/X → concise and witty
   - Facebook → friendly and conversational
   - Blog → structured and detailed
3. Ensure output is **pure valid JSON only** — no extra characters, no code block, no markdown.
4. Match the style of brutalist UI (bold, clear, direct language).
5. Include realistic dummy data in each field.
6. Simulate a successful API fetch response.
`;

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: prompt,
              },
            ],
          },
        ],
      });

      const text =
        response.text ||
        response.candidates?.[0]?.content?.parts?.[0]?.text ||
        '';

      let parsed;
      try {
        parsed = JSON.parse(text);
      } catch (err) {
        console.warn('[AI Response Warning] Invalid JSON, returning raw text.');
        parsed = { raw: text };
      }

      return parsed;
    } catch (error) {
      console.error('[GenAI Error]', error);

      // Ambil pesan error dari SDK Google GenAI
      const message =
        error?.message || error?.response?.error?.message || 'Unknown error';

      if (message.includes('RESOURCE_EXHAUSTED')) {
        throw new HttpException(
          'AI service quota exceeded or temporarily unavailable. Please try again later.',
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }

      if (message.includes('PERMISSION_DENIED')) {
        throw new HttpException(
          'Permission denied. Please check your API credentials or billing status.',
          HttpStatus.FORBIDDEN,
        );
      }

      if (message.includes('INVALID_ARGUMENT')) {
        throw new HttpException(
          'Invalid input. Please check your request parameters.',
          HttpStatus.BAD_REQUEST,
        );
      }

      throw new HttpException(
        'Failed to generate content due to an internal error.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
