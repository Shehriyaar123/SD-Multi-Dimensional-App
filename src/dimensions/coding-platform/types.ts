export type Difficulty = 'Easy' | 'Medium' | 'Hard';

export interface TestCase {
  id: string;
  input: string;
  expectedOutput: string;
  isPublic: boolean; // Public test cases are shown to users, private are hidden
}

export interface CodeTemplate {
  language: string;
  template: string;
}

export interface Problem {
  id: string;
  title: string;
  slug: string;
  difficulty: Difficulty;
  category: string;
  tags: string[];
  statement: string;
  constraints: string;
  inputFormat: string;
  outputFormat: string;
  testCases: TestCase[];
  editorial?: string;
  referenceSolution?: string;
  codeTemplates?: CodeTemplate[];
  sampleInput: string;
  sampleOutput: string;
  createdAt: any;
  updatedAt: any;
  authorId: string;
}

export interface Submission {
  id: string;
  problemId: string;
  userId: string;
  language: string;
  code: string;
  status: 'Pending' | 'Accepted' | 'Wrong Answer' | 'Time Limit Exceeded' | 'Memory Limit Exceeded' | 'Runtime Error' | 'Compilation Error';
  runtime?: number; // in ms
  memory?: number; // in KB
  testCasesPassed: number;
  totalTestCases: number;
  createdAt: any;
}
