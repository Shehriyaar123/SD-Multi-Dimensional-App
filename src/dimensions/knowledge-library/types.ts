import { Difficulty } from '../coding-platform/types';

export interface LibraryResource {
  id: string;
  title: string;
  author: string;
  description: string;
  thumbnail?: string;
  url: string;
  type: 'Book' | 'Paper' | 'Documentation' | 'Article';
  domain: string;
  tags: string[];
  difficulty: Difficulty;
  source: string;
  aiSummary?: string;
  keyPoints?: string[];
  createdAt: any;
  updatedAt: any;
}

export interface LearningPath {
  id: string;
  title: string;
  description: string;
  thumbnail?: string;
  domain: string;
  resources: {
    resourceId: string;
    order: number;
    notes?: string;
  }[];
  problems: {
    problemId: string;
    order: number;
  }[];
  createdAt: any;
  updatedAt: any;
}
