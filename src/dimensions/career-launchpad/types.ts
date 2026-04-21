export interface ResumeData {
  personalInfo: {
    fullName: string;
    email: string;
    phone: string;
    location: string;
    linkedin: string;
    website: string;
    summary: string;
    profileImage?: string;
    socialLinks?: SocialLink[];
  };
  experience: Experience[];
  education: Education[];
  skills: string[];
  projects: Project[];
  coursework: string[];
  certifications: Certification[];
}

export interface SocialLink {
  id: string;
  label: string;
  url: string;
}

export interface Experience {
  id: string;
  company: string;
  role: string;
  location: string;
  startDate: string;
  endDate: string;
  current: boolean;
  description: string;
}

export interface Education {
  id: string;
  school: string;
  degree: string;
  field: string;
  location: string;
  startDate: string;
  endDate: string;
  grade?: string;
  gradeType?: 'cgpa' | 'percentage';
}

export interface Project {
  id: string;
  name: string;
  description: string;
  link: string;
  technologies: string[];
}

export interface Certification {
  id: string;
  name: string;
  issuer: string;
  date: string;
}

export interface ResumeAnalysis {
  score: number;
  missingKeywords: string[];
  suggestions: string[];
  atsCompatibility: {
    score: number;
    issues: string[];
  };
}

export interface InterviewSession {
  id: string;
  role: string;
  company: string;
  questions: string[];
  currentQuestionIndex: number;
  responses: {
    question: string;
    answer: string;
    feedback: string;
    sentiment: string;
    starScore: number;
  }[];
}
