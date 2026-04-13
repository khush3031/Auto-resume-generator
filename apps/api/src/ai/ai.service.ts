import Anthropic from '@anthropic-ai/sdk';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AiService {
  private client: Anthropic;

  constructor(private config: ConfigService) {
    this.client = new Anthropic({
      apiKey: this.config.get('ANTHROPIC_API_KEY'),
    });
  }

  async suggestExperienceBullets(dto: {
    jobTitle: string;
    company: string;
    existingBullets: string[];
  }): Promise<string[]> {
    const prompt = `You are a professional resume writer.

Job Title: ${dto.jobTitle}
Company: ${dto.company}
Existing bullet points the user has already written:
${dto.existingBullets.filter(Boolean).map((b, i) => `${i + 1}. ${b}`).join('\n') || 'None yet'}

Generate exactly 4 strong, quantified, action-verb-led resume bullet points for this role. Each bullet must:
- Start with a strong past-tense action verb (Led, Built, Reduced, Increased, etc.)
- Include a metric or quantifiable impact where possible (%, $, users, time saved)
- Be 1 line, under 120 characters
- Be different from the existing bullets above
- Be relevant to ${dto.jobTitle} at ${dto.company}

Return ONLY a JSON array of 4 strings. No explanation, no markdown, no numbering.
Example: ["Led migration of monolith to microservices reducing deployment time by 60%", "..."]`;

    const response = await this.client.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 600,
      messages: [{ role: 'user', content: prompt }],
    });

    const text = (response.content[0] as Anthropic.TextBlock).text.trim();
    const clean = text.replace(/```json|```/g, '').trim();
    return JSON.parse(clean);
  }

  async suggestSkills(dto: {
    jobTitle: string;
    experienceSummary: string;
  }): Promise<{ technical: string[]; soft: string[] }> {
    const prompt = `You are a professional resume consultant.

Job Title: ${dto.jobTitle}
Experience Summary: ${dto.experienceSummary}

Suggest relevant resume skills for this professional profile.
Return ONLY a JSON object with exactly this shape:
{
  "technical": ["skill1", "skill2", "skill3", "skill4", "skill5", "skill6", "skill7", "skill8"],
  "soft": ["skill1", "skill2", "skill3", "skill4"]
}

Rules:
- technical: 8 specific technical/tool skills most relevant to the job title
- soft: 4 professional soft skills relevant to the seniority level
- No duplicates, no generic filler
- Short skill names only (2-4 words max each)
- No explanation, no markdown, just the JSON object`;

    const response = await this.client.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 400,
      messages: [{ role: 'user', content: prompt }],
    });

    const text = (response.content[0] as Anthropic.TextBlock).text.trim();
    const clean = text.replace(/```json|```/g, '').trim();
    return JSON.parse(clean);
  }

  async suggestSummary(dto: {
    jobTitle: string;
    yearsOfExperience: string;
    topSkills: string[];
    currentRole: string;
    targetRole: string;
  }): Promise<string[]> {
    const prompt = `You are an expert resume writer.

Candidate Profile:
- Current/Target Job Title: ${dto.jobTitle}
- Years of Experience: ${dto.yearsOfExperience}
- Key Skills: ${dto.topSkills.filter(Boolean).join(', ')}
- Current Role: ${dto.currentRole || dto.jobTitle}
- Target Role: ${dto.targetRole || dto.jobTitle}

Write 3 different professional summary options for this candidate's resume.
Each summary must:
- Be 2-3 sentences (50-80 words)
- Open with years of experience and job title
- Mention 2-3 key skills naturally
- End with what value they bring to employers
- Sound human and confident, not robotic

Return ONLY a JSON array of 3 strings.
No explanation, no markdown, no numbering outside the array.`;

    const response = await this.client.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 800,
      messages: [{ role: 'user', content: prompt }],
    });

    const text = (response.content[0] as Anthropic.TextBlock).text.trim();
    const clean = text.replace(/```json|```/g, '').trim();
    return JSON.parse(clean);
  }
}
