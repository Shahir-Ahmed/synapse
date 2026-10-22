export type UserRole = 'teacher' | 'student';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  studentId?: string; // Present if role === 'student'
  gradeLevel?: string; // e.g. "Grade 9"
  schoolName?: string;
}

export interface Student {
  id: string;
  studentId: string; // e.g. "STU-101"
  name: string;
  email: string;
  gradeLevel: string;
  schoolName?: string;
  createdAt: string;
}

export interface AssessmentTopic {
  id: string;
  name: string;
  marksAchieved: number;
  marksMax: number;
  percentage: number; // e.g. 85.0
  gradeLetter?: string; // e.g. "A"
}

export interface FeedbackContent {
  strengths: string;
  growthAreas: string;
  nextSteps: string;
  generatedBy: 'gemini' | 'rule_engine';
  generatedAt: string;
  lastEditedAt?: string;
  tone?: 'encouraging' | 'rigorous' | 'foundational';
}

export interface StudentReflection {
  acknowledgedAt: string;
  reflectionNote?: string;
}

export interface Assessment {
  id: string;
  studentId: string;
  studentName: string;
  teacherId: string;
  teacherName: string;
  title: string;
  subject?: string; // e.g. "Biology", "Algebra", "English"
  date: string;
  topics: AssessmentTopic[];
  totalAchieved: number;
  totalMax: number;
  overallPercentage: number;
  overallGradeLetter?: string;
  teacherNotes?: string;
  feedback?: FeedbackContent;
  status: 'draft' | 'published';
  studentReflection?: StudentReflection;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
}

export interface GenerateFeedbackRequest {
  assessmentTitle: string;
  studentName: string;
  topics: {
    name: string;
    marksAchieved: number;
    marksMax: number;
    percentage: number;
  }[];
  overallPercentage: number;
  teacherNotes?: string;
  tone?: 'encouraging' | 'rigorous' | 'foundational';
  focusSection?: 'all' | 'strengths' | 'growthAreas' | 'nextSteps';
}

export interface AuthResponse {
  token: string;
  user: User;
}

export function calculateGradeLetter(percentage: number): string {
  if (percentage >= 93) return 'A';
  if (percentage >= 90) return 'A-';
  if (percentage >= 87) return 'B+';
  if (percentage >= 83) return 'B';
  if (percentage >= 80) return 'B-';
  if (percentage >= 77) return 'C+';
  if (percentage >= 73) return 'C';
  if (percentage >= 70) return 'C-';
  if (percentage >= 65) return 'D+';
  if (percentage >= 60) return 'D';
  return 'F';
}
