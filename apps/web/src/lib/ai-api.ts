import { api } from './api';

export const aiApi = {
  suggestBullets: (
    jobTitle: string,
    company: string,
    existingBullets: string[],
  ): Promise<string[]> =>
    api
      .post('/ai/suggest-bullets', { jobTitle, company, existingBullets })
      .then((r: any) => r.data.data.suggestions as string[]),

  suggestSkills: (
    jobTitle: string,
    experienceSummary: string,
  ): Promise<{ technical: string[]; soft: string[] }> =>
    api
      .post('/ai/suggest-skills', { jobTitle, experienceSummary })
      .then((r: any) => r.data.data as { technical: string[]; soft: string[] }),

  suggestSummary: (payload: {
    jobTitle: string;
    yearsOfExperience: string;
    topSkills: string[];
    currentRole: string;
    targetRole: string;
  }): Promise<string[]> =>
    api
      .post('/ai/suggest-summary', payload)
      .then((r: any) => r.data.data.suggestions as string[]),
};
