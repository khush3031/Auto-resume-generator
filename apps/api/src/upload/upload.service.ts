import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';
import Anthropic from '@anthropic-ai/sdk';

@Injectable()
export class UploadService {
  private client: Anthropic;

  constructor(private config: ConfigService) {
    this.client = new Anthropic({
      apiKey: this.config.get('ANTHROPIC_API_KEY'),
    });
  }

  async extractText(file: Express.Multer.File): Promise<string> {
    const ext = path.extname(file.originalname).toLowerCase();

    if (ext === '.pdf') {
      // Dynamically import pdf-parse to avoid issues with ESM
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const pdfParse = require('pdf-parse');
      const dataBuffer = fs.readFileSync(file.path);
      const pdfData = await pdfParse(dataBuffer);
      if (!pdfData.text || pdfData.text.trim().length < 50) {
        throw new BadRequestException(
          'Could not extract text from PDF. The file may be scanned. Try uploading as an image instead.',
        );
      }
      return pdfData.text;
    }

    if (['.jpg', '.jpeg', '.png', '.webp'].includes(ext)) {
      const imageBuffer = fs.readFileSync(file.path);
      const base64 = imageBuffer.toString('base64');
      const mediaType = ext === '.png' ? 'image/png' : 'image/jpeg';

      const response = await this.client.messages.create({
        model: 'claude-sonnet-4-5',
        max_tokens: 2000,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image',
                source: {
                  type: 'base64',
                  media_type: mediaType as 'image/png' | 'image/jpeg',
                  data: base64,
                },
              },
              {
                type: 'text',
                text: 'This is a resume image. Please extract ALL text from it exactly as it appears, preserving the structure and order. Include all sections: name, contact info, summary, experience, education, skills, certifications, languages. Output only the extracted text, nothing else.',
              },
            ],
          },
        ],
      });

      return (response.content[0] as Anthropic.TextBlock).text;
    }

    throw new BadRequestException(
      'Unsupported file type. Please upload a PDF, JPG, PNG, or WEBP.',
    );
  }

  async parseResumeText(rawText: string): Promise<Record<string, string>> {
    const prompt = `You are a resume parser. Extract information from this resume text and return it as a flat JSON object.

Resume text:
---
${rawText.substring(0, 8000)}
---

Return ONLY a valid JSON object with these exact keys (use empty string "" if not found):

{
  "fullName": "",
  "jobTitle": "",
  "email": "",
  "phone": "",
  "location": "",
  "linkedin": "",
  "website": "",
  "initials": "",
  "summary": "",

  "job1Title": "",
  "job1Company": "",
  "job1Location": "",
  "job1Start": "",
  "job1End": "",
  "job1Bullet1": "",
  "job1Bullet2": "",
  "job1Bullet3": "",

  "job2Title": "",
  "job2Company": "",
  "job2Location": "",
  "job2Start": "",
  "job2End": "",
  "job2Bullet1": "",
  "job2Bullet2": "",

  "degree": "",
  "university": "",
  "graduationYear": "",

  "skill1": "",
  "skill2": "",
  "skill3": "",
  "skill4": "",
  "skill5": "",

  "lang1": "",
  "lang1Level": "",
  "lang2": "",
  "lang2Level": "",

  "cert1": "",
  "cert1Issuer": "",
  "cert1Year": "",
  "cert2": "",
  "cert2Issuer": "",
  "cert2Year": ""
}

Rules:
- initials: derive from fullName (e.g. "Jane Smith" -> "JS")
- For experience bullets: extract actual achievement/responsibility statements
- For dates: use format like "Jan 2021" or "2021" or "Present"
- Keep all values concise and suitable for a resume
- No explanation, no markdown fences, just the raw JSON object`;

    const response = await this.client.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 2000,
      messages: [{ role: 'user', content: prompt }],
    });

    const text = (response.content[0] as Anthropic.TextBlock).text.trim();
    const clean = text.replace(/```json|```/g, '').trim();

    try {
      return JSON.parse(clean);
    } catch {
      throw new BadRequestException(
        'Failed to parse resume structure. Please try again.',
      );
    }
  }

  async processUpload(
    file: Express.Multer.File,
  ): Promise<Record<string, string>> {
    try {
      const rawText = await this.extractText(file);
      const parsed = await this.parseResumeText(rawText);
      return parsed;
    } finally {
      if (fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }
    }
  }
}
