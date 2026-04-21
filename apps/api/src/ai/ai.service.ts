import Anthropic from '@anthropic-ai/sdk';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AiService {
  private client: Anthropic;
  private isConfigured: boolean;

  constructor(private config: ConfigService) {
    const apiKey = this.config.get<string>('ANTHROPIC_API_KEY');
    this.isConfigured = !!(
      apiKey &&
      apiKey.length > 20 &&
      !apiKey.includes('your_') &&
      !apiKey.includes('your-')
    );
    console.log(
      `[AiService] ANTHROPIC_API_KEY configured: ${this.isConfigured}`,
      apiKey ? `(key starts with: ${apiKey.slice(0, 12)}...)` : '(key is missing)',
    );
    this.client = new Anthropic({ apiKey: apiKey || 'placeholder' });
  }

  private checkConfigured(): void {
    if (!this.isConfigured) {
      throw new Error(
        'ANTHROPIC_API_KEY is not configured. Add your key to apps/api/.env and restart the API server.',
      );
    }
  }

  private async callClaude(prompt: string, maxTokens: number): Promise<string> {
    this.checkConfigured();
    const response = await this.client.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: maxTokens,
      messages: [{ role: 'user', content: prompt }],
    });
    return (response.content[0] as Anthropic.TextBlock).text.trim();
  }

  private safeParseJson<T>(text: string, fallback: T): T {
    try {
      const clean = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
      return JSON.parse(clean) as T;
    } catch {
      console.error('[AiService] JSON parse failed. Raw text:', text.slice(0, 200));
      return fallback;
    }
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

    const text = await this.callClaude(prompt, 600);
    return this.safeParseJson<string[]>(text, [
      `Led key initiatives as ${dto.jobTitle} at ${dto.company}`,
      'Collaborated cross-functionally to deliver projects on time',
      'Improved team processes and workflows',
      'Contributed to product quality and performance',
    ]);
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

    const text = await this.callClaude(prompt, 400);
    return this.safeParseJson<{ technical: string[]; soft: string[] }>(text, {
      technical: ['Communication', 'Problem Solving', 'Teamwork', 'Time Management'],
      soft: ['Adaptability', 'Leadership', 'Critical Thinking', 'Collaboration'],
    });
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

    const text = await this.callClaude(prompt, 800);
    return this.safeParseJson<string[]>(text, [
      `Experienced ${dto.jobTitle} with ${dto.yearsOfExperience} years of industry expertise. Passionate about delivering high-quality results and collaborating with cross-functional teams to achieve business goals.`,
    ]);
  }
}
