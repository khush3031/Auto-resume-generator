export type ResumeTemplate = {
  id: string;
  name: string;
  slug: string;
  style: string;
  thumbnail: string;
  htmlPath: string;
};

export type ResumeData = {
  personalInfo: {
    fullName: string;
    jobTitle: string;
    email: string;
    phone: string;
    location: string;
    website: string;
  };
  summary: string;
  experience: Array<{ title: string; company: string; date: string; description: string }>;
  education: Array<{ degree: string; school: string; date: string }>;
  skills: string[];
  languages: Array<{ name: string; level: string }>;
  certifications: string[];
};

export type ResumeRecord = {
  id: string;
  templateId: string;
  userId?: string;
  data: ResumeData;
  createdAt: string;
  updatedAt: string;
};

export type ApiResponse<T> = {
  success: boolean;
  data: T;
  message: string;
};
