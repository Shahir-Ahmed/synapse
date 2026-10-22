import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { randomUUID } from 'node:crypto';
import { calculateGradeLetter, type User, type Student, type Assessment, type StudentReflection } from '../src/types/index.ts';
import { hashPassword, isPasswordHash } from './passwords.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DEFAULT_DATA_DIR = process.env.DATA_DIR?.trim() || (process.env.VERCEL ? path.resolve(process.cwd(), 'data') : path.resolve(__dirname, '../data'));

export interface StoreData {
  users: (User & { passwordHash: string })[];
  students: Student[];
  assessments: Assessment[];
}

const DEFAULT_USERS: (User & { passwordHash: string })[] = [
  {
    id: 'teacher-1',
    name: 'Dr. Sarah Jenkins',
    email: 'sarah.jenkins@clearfeedback.edu',
    passwordHash: 'teacher123',
    role: 'teacher',
    schoolName: 'Westfield STEM Academy',
  },
  {
    id: 'student-1',
    name: 'Alex Chen',
    email: 'alex.chen@student.clearfeedback.edu',
    passwordHash: 'student123',
    role: 'student',
    studentId: 'STU-101',
    gradeLevel: 'Grade 9',
    schoolName: 'Westfield STEM Academy',
  },
  {
    id: 'student-2',
    name: 'Maya Patel',
    email: 'maya.patel@student.clearfeedback.edu',
    passwordHash: 'student123',
    role: 'student',
    studentId: 'STU-102',
    gradeLevel: 'Grade 10',
    schoolName: 'Westfield STEM Academy',
  },
  {
    id: 'student-3',
    name: 'Liam Johnson',
    email: 'liam.johnson@student.clearfeedback.edu',
    passwordHash: 'student123',
    role: 'student',
    studentId: 'STU-103',
    gradeLevel: 'Grade 9',
    schoolName: 'Westfield STEM Academy',
  },
];

const DEFAULT_STUDENTS: Student[] = [
  {
    id: 'student-1',
    studentId: 'STU-101',
    name: 'Alex Chen',
    email: 'alex.chen@student.clearfeedback.edu',
    gradeLevel: 'Grade 9',
    schoolName: 'Westfield STEM Academy',
    createdAt: '2026-09-01T08:00:00.000Z',
  },
  {
    id: 'student-2',
    studentId: 'STU-102',
    name: 'Maya Patel',
    email: 'maya.patel@student.clearfeedback.edu',
    gradeLevel: 'Grade 10',
    schoolName: 'Westfield STEM Academy',
    createdAt: '2026-09-01T08:00:00.000Z',
  },
  {
    id: 'student-3',
    studentId: 'STU-103',
    name: 'Liam Johnson',
    email: 'liam.johnson@student.clearfeedback.edu',
    gradeLevel: 'Grade 9',
    schoolName: 'Westfield STEM Academy',
    createdAt: '2026-09-02T08:00:00.000Z',
  },
];

const DEFAULT_ASSESSMENTS: Assessment[] = [
  {
    id: 'asm-101',
    studentId: 'STU-101',
    studentName: 'Alex Chen',
    teacherId: 'teacher-1',
    teacherName: 'Dr. Sarah Jenkins',
    title: 'Unit 2: Molecular & Cellular Biology',
    subject: 'Biology',
    date: '2026-10-18',
    topics: [
      { id: 'top-1', name: 'Cellular Respiration', marksAchieved: 19, marksMax: 20, percentage: 95.0, gradeLetter: 'A' },
      { id: 'top-2', name: 'Enzyme Kinetics', marksAchieved: 18, marksMax: 20, percentage: 90.0, gradeLetter: 'A-' },
      { id: 'top-3', name: 'Photosynthesis Stages', marksAchieved: 17, marksMax: 20, percentage: 85.0, gradeLetter: 'B' },
      { id: 'top-4', name: 'Membrane Transport & Osmosis', marksAchieved: 13, marksMax: 20, percentage: 65.0, gradeLetter: 'D+' },
    ],
    totalAchieved: 67,
    totalMax: 80,
    overallPercentage: 83.8,
    overallGradeLetter: 'B',
    teacherNotes: 'Demonstrated outstanding grasp of energetic pathways and enzyme mechanics. Calculation errors observed on water potential equations.',
    feedback: {
      strengths: 'Outstanding mastery of biochemical metabolic pathways, particularly in Cellular Respiration (95.0%) and Enzyme Kinetics (90.0%), with clear, thorough procedural explanations.',
      growthAreas: 'Membrane Transport & Osmosis (65.0%) shows difficulty distinguishing between active transport mechanisms and facilitated diffusion when calculating osmotic gradient pressures.',
      nextSteps: 'Complete the three water potential practice diagrams in Chapter 4, section 3, and annotate whether ATP is required for each transport scenario before Friday’s review session.',
      generatedBy: 'gemini',
      generatedAt: '2026-10-19T14:30:00.000Z',
      tone: 'encouraging',
    },
    status: 'published',
    studentReflection: {
      acknowledgedAt: '2026-10-20T09:15:00.000Z',
      reflectionNote: 'Thank you Dr. Jenkins. I reviewed Section 4.3 and redrew the hypertonic cell diagram.',
    },
    createdAt: '2026-10-19T14:00:00.000Z',
    updatedAt: '2026-10-19T14:35:00.000Z',
    publishedAt: '2026-10-19T14:35:00.000Z',
  },
  {
    id: 'asm-102',
    studentId: 'STU-102',
    studentName: 'Maya Patel',
    teacherId: 'teacher-1',
    teacherName: 'Dr. Sarah Jenkins',
    title: 'Midterm Examination: Linear Functions & Systems',
    subject: 'Mathematics',
    date: '2026-10-20',
    topics: [
      { id: 'top-201', name: 'Quadratic Factoring', marksAchieved: 19, marksMax: 20, percentage: 95.0, gradeLetter: 'A' },
      { id: 'top-202', name: 'Systems of Equations', marksAchieved: 16, marksMax: 20, percentage: 80.0, gradeLetter: 'B-' },
      { id: 'top-203', name: 'Word Problem Translation', marksAchieved: 14, marksMax: 20, percentage: 70.0, gradeLetter: 'C-' },
      { id: 'top-204', name: 'Coordinate Geometry & Slope', marksAchieved: 11, marksMax: 20, percentage: 55.0, gradeLetter: 'F' },
    ],
    totalAchieved: 60,
    totalMax: 80,
    overallPercentage: 75.0,
    overallGradeLetter: 'C',
    teacherNotes: 'Factoring precision was exceptional. Struggles with graphing negative slope intercepts on the coordinate grid.',
    feedback: {
      strengths: 'Strong fluency in Quadratic Factoring (95.0%), consistently setting up correct binomial expansions and solving roots without algebraic errors.',
      growthAreas: 'Coordinate Geometry & Slope (55.0%) indicates recurring confusion when determining perpendicular slopes and locating negative y-intercepts.',
      nextSteps: 'Work through the coordinate slope-intercept checklist on Worksheet 5B, verifying the sign of the rise/run fraction on graph paper before plotting the line.',
      generatedBy: 'gemini',
      generatedAt: '2026-10-21T10:15:00.000Z',
      tone: 'encouraging',
    },
    status: 'draft',
    createdAt: '2026-10-21T10:00:00.000Z',
    updatedAt: '2026-10-21T10:15:00.000Z',
  },
];

export class MemoryStore {
  private data: StoreData;
  private readonly dataFile: string;

  constructor(dataDir: string = DEFAULT_DATA_DIR) {
    this.dataFile = path.join(dataDir, 'store.json');
    this.data = this.load();

    // Upgrade legacy stores that contain raw passwords without invalidating demo accounts.
    let migrated = false;
    for (const user of this.data.users) {
      if (!isPasswordHash(user.passwordHash)) {
        user.passwordHash = hashPassword(user.passwordHash);
        migrated = true;
      }
    }
    if (migrated) this.save();
  }

  private get dataDir(): string {
    return path.dirname(this.dataFile);
  }

  private load(): StoreData {
    try {
      if (!fs.existsSync(this.dataDir)) {
        fs.mkdirSync(this.dataDir, { recursive: true });
      }
      if (fs.existsSync(this.dataFile)) {
        const raw = fs.readFileSync(this.dataFile, 'utf-8');
        return JSON.parse(raw);
      }
    } catch (err) {
      console.warn('Failed to read persisted store, using default seed:', err);
    }

    const initialData: StoreData = {
      users: DEFAULT_USERS,
      students: DEFAULT_STUDENTS,
      assessments: DEFAULT_ASSESSMENTS,
    };
    this.save(initialData);
    return initialData;
  }

  public save(data: StoreData = this.data): void {
    try {
      if (!fs.existsSync(this.dataDir)) {
        fs.mkdirSync(this.dataDir, { recursive: true });
      }
      fs.writeFileSync(this.dataFile, JSON.stringify(data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to write store to disk:', err);
    }
  }

  public getUsers() {
    return this.data.users;
  }

  public findUserByEmail(email: string) {
    return this.data.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  }

  public findUserById(id: string) {
    return this.data.users.find(u => u.id === id);
  }

  public registerUser(user: { name: string; email: string; password: string; role: 'teacher' | 'student'; studentId?: string; gradeLevel?: string; schoolName?: string }): User {
    const normalizedEmail = user.email.trim().toLowerCase();
    const normalizedStudentId = user.studentId?.trim().toUpperCase();
    if (this.findUserByEmail(normalizedEmail)) {
      throw new Error(`An account with email ${normalizedEmail} already exists.`);
    }
    if (user.role === 'student' && normalizedStudentId && this.findStudentByStudentId(normalizedStudentId)) {
      throw new Error(`Student with ID "${normalizedStudentId}" already exists.`);
    }

    const newUser: User & { passwordHash: string } = {
      id: `${user.role}-${randomUUID()}`,
      name: user.name.trim(),
      email: normalizedEmail,
      passwordHash: hashPassword(user.password),
      role: user.role,
      studentId: normalizedStudentId || undefined,
      gradeLevel: user.gradeLevel || (user.role === 'student' ? 'Grade 9' : undefined),
      schoolName: user.schoolName?.trim() || 'Westfield STEM Academy',
    };

    this.data.users.push(newUser);

    // If role is student, also record in students roster
    if (user.role === 'student') {
      let studentId = newUser.studentId;
      if (!studentId) {
        do {
          studentId = `STU-${randomUUID().slice(0, 8).toUpperCase()}`;
        } while (this.findStudentByStudentId(studentId));
      }
      newUser.studentId = studentId;

      this.data.students.push({
        id: newUser.id,
        studentId,
        name: newUser.name,
        email: newUser.email,
        gradeLevel: newUser.gradeLevel || 'Grade 9',
        schoolName: newUser.schoolName,
        createdAt: new Date().toISOString(),
      });
    }

    this.save();
    return {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      studentId: newUser.studentId,
      gradeLevel: newUser.gradeLevel,
      schoolName: newUser.schoolName,
    };
  }

  public getStudents(): Student[] {
    return this.data.students;
  }

  public findStudentByStudentId(studentId: string): Student | undefined {
    const normalizedId = studentId.trim().toUpperCase();
    return this.data.students.find(s => s.studentId.trim().toUpperCase() === normalizedId);
  }

  public addStudent(student: Omit<Student, 'id' | 'createdAt'>): Student {
    const normalizedStudentId = student.studentId.trim().toUpperCase();
    const normalizedEmail = student.email.trim().toLowerCase();
    if (this.findStudentByStudentId(normalizedStudentId)) {
      throw new Error(`Student with ID "${normalizedStudentId}" already exists.`);
    }
    if (this.findUserByEmail(normalizedEmail)) {
      throw new Error(`An account with email ${normalizedEmail} already exists.`);
    }

    const newStudent: Student = {
      ...student,
      studentId: normalizedStudentId,
      email: normalizedEmail,
      id: `student-${randomUUID()}`,
      createdAt: new Date().toISOString(),
    };
    this.data.students.push(newStudent);

    // Also provision user account
    const existingUser = this.findUserByEmail(student.email);
    if (!existingUser) {
      this.data.users.push({
        id: newStudent.id,
        name: newStudent.name,
        email: newStudent.email,
        passwordHash: hashPassword('student123'),
        role: 'student',
        studentId: newStudent.studentId,
        gradeLevel: newStudent.gradeLevel,
        schoolName: newStudent.schoolName || 'Westfield STEM Academy',
      });
    }

    this.save();
    return newStudent;
  }

  public getAssessments(): Assessment[] {
    return this.data.assessments;
  }

  public findAssessmentById(id: string): Assessment | undefined {
    return this.data.assessments.find(a => a.id === id);
  }

  public addAssessment(assessment: Omit<Assessment, 'id' | 'createdAt' | 'updatedAt'>): Assessment {
    const newAssessment: Assessment = {
      ...assessment,
      id: `asm-${randomUUID()}`,
      overallGradeLetter: calculateGradeLetter(assessment.overallPercentage),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.data.assessments.push(newAssessment);
    this.save();
    return newAssessment;
  }

  public updateAssessment(id: string, updates: Partial<Assessment>): Assessment | null {
    const index = this.data.assessments.findIndex(a => a.id === id);
    if (index === -1) return null;

    const existing = this.data.assessments[index];
    const overallPercentage = updates.overallPercentage !== undefined ? updates.overallPercentage : existing.overallPercentage;
    const overallGradeLetter = calculateGradeLetter(overallPercentage);

    const updated: Assessment = {
      ...existing,
      ...updates,
      overallGradeLetter,
      updatedAt: new Date().toISOString(),
    };

    this.data.assessments[index] = updated;
    this.save();
    return updated;
  }

  public acknowledgeAssessment(id: string, studentId: string, reflectionNote?: string): Assessment | null {
    const index = this.data.assessments.findIndex(a => a.id === id && a.studentId === studentId);
    if (index === -1) return null;

    const reflection: StudentReflection = {
      acknowledgedAt: new Date().toISOString(),
      reflectionNote: reflectionNote?.trim() || undefined,
    };

    this.data.assessments[index] = {
      ...this.data.assessments[index],
      studentReflection: reflection,
      updatedAt: new Date().toISOString(),
    };

    this.save();
    return this.data.assessments[index];
  }

  public deleteAssessment(id: string): boolean {
    const index = this.data.assessments.findIndex(a => a.id === id);
    if (index === -1) return false;
    this.data.assessments.splice(index, 1);
    this.save();
    return true;
  }
}

export const store = new MemoryStore();
