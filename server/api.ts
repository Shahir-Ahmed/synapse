import { Router, Request, Response, NextFunction } from 'express';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { store } from './store';
import { verifyPassword } from './passwords';
import { isRecord, isValidDateOnly, validateAssessmentTopics, validateFeedbackObject } from './assessmentValidation';
import { generateFeedback } from './gemini';
import { calculateGradeLetter, type User, type Assessment, type AssessmentTopic } from '../src/types/index';

export const apiRouter = Router();

// Signed, stateless bearer tokens work across Vercel serverless invocations.
// Set SESSION_SECRET to a long random value in Vercel project environment variables.
type SessionPayload = { sub: string; exp: number };
const SESSION_TTL_SECONDS = 8 * 60 * 60;

function sessionSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (secret && secret.length >= 32) return secret;
  if (process.env.NODE_ENV === 'production') {
    throw new Error('SESSION_SECRET must be configured with at least 32 characters in production.');
  }
  return 'local-development-only-session-secret-change-me';
}

function signSessionPayload(encodedPayload: string): string {
  return createHmac('sha256', sessionSecret()).update(encodedPayload).digest('base64url');
}

function publicUser(user: User): User {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    studentId: user.studentId,
    gradeLevel: user.gradeLevel,
    schoolName: user.schoolName,
  };
}

function createSession(user: User): { token: string; user: User } {
  const payload: SessionPayload = { sub: user.id, exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS };
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const token = `${encodedPayload}.${signSessionPayload(encodedPayload)}`;
  return { token, user: publicUser(user) };
}

function getAuthUser(req: Request): User | null {
  const authHeader = req.headers.authorization;
  if (!authHeader) return null;
  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  if (!match) return null;

  try {
    const token = match[1].trim();
    const [encodedPayload, suppliedSignature, extra] = token.split('.');
    if (!encodedPayload || !suppliedSignature || extra !== undefined) return null;
    const expectedSignature = signSessionPayload(encodedPayload);
    const supplied = Buffer.from(suppliedSignature, 'base64url');
    const expected = Buffer.from(expectedSignature, 'base64url');
    if (supplied.length !== expected.length || !timingSafeEqual(supplied, expected)) return null;

    const payload = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString('utf8')) as Partial<SessionPayload>;
    if (typeof payload.sub !== 'string' || typeof payload.exp !== 'number' || payload.exp <= Math.floor(Date.now() / 1000)) return null;
    const user = store.findUserById(payload.sub);
    return user ? publicUser(user) : null;
  } catch {
    return null;
  }
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const demoLoginEnabled = () => process.env.NODE_ENV !== 'production' || process.env.ENABLE_DEMO_LOGIN === 'true';

// Reject malformed JSON shapes before route handlers destructure request bodies.
apiRouter.use((req: Request, res: Response, next: NextFunction) => {
  if (req.body === undefined) req.body = {};
  if (!isRecord(req.body)) {
    return res.status(400).json({ error: 'Request body must be a JSON object.' });
  }
  next();
});

// Authentication middleware
function requireAuth(req: Request, res: Response, next: NextFunction) {
  const user = getAuthUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Authentication required. Please sign in.' });
  }
  (req as any).user = user;
  next();
}

// Teacher RBAC middleware
function requireTeacher(req: Request, res: Response, next: NextFunction) {
  const user = (req as any).user as User;
  if (user.role !== 'teacher') {
    return res.status(403).json({ error: 'Access denied. Only educators can perform this action.' });
  }
  next();
}

// -------------------------------------------------------------
// Auth Endpoints
// -------------------------------------------------------------

apiRouter.post('/auth/register', (req: Request, res: Response) => {
  const { name, email, password, role, studentId, gradeLevel, schoolName, teacherRegistrationCode } = req.body;

  if (typeof name !== 'string' || !name.trim()) {
    return res.status(400).json({ error: 'Full name is required.' });
  }
  if (typeof email !== 'string' || !EMAIL_PATTERN.test(email.trim())) {
    return res.status(400).json({ error: 'A valid email address is required.' });
  }
  if (typeof password !== 'string' || password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters.' });
  }
  if (role !== 'teacher' && role !== 'student') {
    return res.status(400).json({ error: 'Role must be teacher or student.' });
  }
  if (studentId !== undefined && typeof studentId !== 'string') {
    return res.status(400).json({ error: 'Student ID must be text.' });
  }
  if (role === 'teacher' && process.env.NODE_ENV === 'production') {
    const expectedCode = process.env.TEACHER_REGISTRATION_CODE?.trim();
    if (!expectedCode || typeof teacherRegistrationCode !== 'string' || teacherRegistrationCode !== expectedCode) {
      return res.status(403).json({ error: 'Teacher registration requires an institution-issued registration code.' });
    }
  }

  const normalizedEmail = email.trim().toLowerCase();
  if (store.findUserByEmail(normalizedEmail)) {
    return res.status(409).json({ error: 'An account with this email address already exists.' });
  }

  const normalizedStudentId = typeof studentId === 'string' ? studentId.trim().toUpperCase() : '';
  if (role === 'student' && normalizedStudentId && store.findStudentByStudentId(normalizedStudentId)) {
    return res.status(409).json({ error: 'This student ID is already assigned. Contact your teacher or use a different ID.' });
  }

  try {
    const user = store.registerUser({
      name: name.trim(),
      email: normalizedEmail,
      password,
      role,
      studentId: role === 'student' ? normalizedStudentId || undefined : undefined,
      gradeLevel: typeof gradeLevel === 'string' ? gradeLevel.trim() : undefined,
      schoolName: typeof schoolName === 'string' ? schoolName.trim() : undefined,
    });
    return res.status(201).json(createSession(user));
  } catch {
    return res.status(500).json({ error: 'Unable to create the account. Please try again.' });
  }
});

apiRouter.post('/auth/login', (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (typeof email !== 'string' || !email.trim() || typeof password !== 'string' || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  const userRecord = store.findUserByEmail(email.trim());
  if (!userRecord || !verifyPassword(password, userRecord.passwordHash)) {
    return res.status(401).json({ error: 'Invalid email address or password.' });
  }

  return res.json(createSession(userRecord));
});

apiRouter.post('/auth/demo-switch', (req: Request, res: Response) => {
  if (!demoLoginEnabled()) {
    return res.status(403).json({ error: 'Demo login is disabled in production. Enable it only for a deployment using non-sensitive demo data.' });
  }

  const { role, email } = req.body;
  if (role !== 'teacher' && role !== 'student') {
    return res.status(400).json({ error: 'Role must be teacher or student.' });
  }
  if (typeof email !== 'string' || !email.trim()) {
    return res.status(400).json({ error: 'A demo account email is required.' });
  }

  const targetUser = store.findUserByEmail(email.trim());
  if (!targetUser || targetUser.role !== role) {
    return res.status(404).json({ error: 'The requested demo account was not found.' });
  }

  return res.json(createSession(targetUser));
});

apiRouter.get('/auth/me', (req: Request, res: Response) => {
  const user = getAuthUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  return res.json({ user });
});

apiRouter.post('/auth/logout', requireAuth, (req: Request, res: Response) => {
  // Stateless tokens expire after eight hours; the client drops its token on logout.
  return res.json({ success: true });
});

// -------------------------------------------------------------
// Students Endpoints
// -------------------------------------------------------------

apiRouter.get('/students', requireAuth, requireTeacher, (req: Request, res: Response) => {
  const students = store.getStudents();
  return res.json({ students });
});

apiRouter.post('/students', requireAuth, requireTeacher, (req: Request, res: Response) => {
  const { studentId, name, email, gradeLevel, schoolName } = req.body;

  if (typeof studentId !== 'string' || !studentId.trim()) {
    return res.status(400).json({ error: 'Student ID is required (e.g., STU-104).' });
  }
  if (typeof name !== 'string' || !name.trim()) {
    return res.status(400).json({ error: 'Student name is required.' });
  }
  if (typeof email !== 'string' || !EMAIL_PATTERN.test(email.trim())) {
    return res.status(400).json({ error: 'A valid student email address is required.' });
  }
  if (gradeLevel !== undefined && typeof gradeLevel !== 'string') {
    return res.status(400).json({ error: 'Grade level must be text.' });
  }
  if (schoolName !== undefined && typeof schoolName !== 'string') {
    return res.status(400).json({ error: 'School name must be text.' });
  }

  const normalizedId = studentId.trim().toUpperCase();
  const normalizedEmail = email.trim().toLowerCase();
  if (store.findStudentByStudentId(normalizedId)) {
    return res.status(409).json({ error: `Student with ID "${normalizedId}" already exists.` });
  }
  if (store.findUserByEmail(normalizedEmail)) {
    return res.status(409).json({ error: 'An account with this email address already exists.' });
  }

  try {
    const newStudent = store.addStudent({
      studentId: normalizedId,
      name: name.trim(),
      email: normalizedEmail,
      gradeLevel: gradeLevel?.trim() || 'Grade 9',
      schoolName: schoolName?.trim() || 'Westfield STEM Academy',
    });
    return res.status(201).json({ student: newStudent });
  } catch {
    return res.status(500).json({ error: 'Unable to add the student. Please try again.' });
  }
});

// -------------------------------------------------------------
// Assessments Endpoints (Strict RBAC)
// -------------------------------------------------------------

apiRouter.get('/assessments', requireAuth, (req: Request, res: Response) => {
  const user = (req as any).user as User;
  const allAssessments = store.getAssessments();

  if (user.role === 'teacher') {
    return res.json({ assessments: allAssessments });
  }

  // Students ONLY see published assessments matching their studentId
  const studentAssessments = allAssessments.filter(
    a => a.studentId === user.studentId && a.status === 'published'
  );

  return res.json({ assessments: studentAssessments });
});

apiRouter.get('/assessments/:id', requireAuth, (req: Request, res: Response) => {
  const user = (req as any).user as User;
  const assessment = store.findAssessmentById(req.params.id);

  if (!assessment) {
    return res.status(404).json({ error: 'Assessment not found.' });
  }

  if (user.role === 'student') {
    if (assessment.studentId !== user.studentId || assessment.status !== 'published') {
      return res.status(403).json({ error: 'You do not have permission to view this assessment.' });
    }
  }

  return res.json({ assessment });
});

apiRouter.post('/assessments', requireAuth, requireTeacher, (req: Request, res: Response) => {
  const teacher = (req as any).user as User;
  const { studentId, title, subject, date, topics, teacherNotes, feedback, status } = req.body;

  if (typeof studentId !== 'string' || !studentId.trim()) {
    return res.status(400).json({ error: 'Student selection is required.' });
  }
  if (typeof title !== 'string' || !title.trim()) {
    return res.status(400).json({ error: 'Assessment title is required.' });
  }
  if (subject !== undefined && typeof subject !== 'string') {
    return res.status(400).json({ error: 'Subject must be text.' });
  }
  if (date !== undefined && (typeof date !== 'string' || !isValidDateOnly(date))) {
    return res.status(400).json({ error: 'Assessment date must be a valid YYYY-MM-DD date.' });
  }
  if (teacherNotes !== undefined && teacherNotes !== null && typeof teacherNotes !== 'string') {
    return res.status(400).json({ error: 'Teacher notes must be text.' });
  }
  if (feedback !== undefined && feedback !== null && !validateFeedbackObject(feedback, true)) {
    return res.status(400).json({ error: 'Feedback must include text for strengths, growth areas, and next steps.' });
  }
  if (status !== undefined && status !== 'draft') {
    return res.status(400).json({ error: 'New assessments must start as a draft. Publish them after review.' });
  }

  const student = store.findStudentByStudentId(studentId.trim());
  if (!student) {
    return res.status(404).json({ error: `Student with ID ${studentId.trim()} not found.` });
  }

  const topicResult = validateAssessmentTopics(topics);
  if (!topicResult.ok) return res.status(400).json({ error: topicResult.error });

  const newAssessment = store.addAssessment({
    studentId: student.studentId,
    studentName: student.name,
    teacherId: teacher.id,
    teacherName: teacher.name,
    title: title.trim(),
    subject: typeof subject === 'string' && subject.trim() ? subject.trim() : 'General Assessment',
    date: date || new Date().toISOString().split('T')[0],
    topics: topicResult.topics,
    totalAchieved: topicResult.totalAchieved,
    totalMax: topicResult.totalMax,
    overallPercentage: topicResult.overallPercentage,
    overallGradeLetter: calculateGradeLetter(topicResult.overallPercentage),
    teacherNotes: typeof teacherNotes === 'string' && teacherNotes.trim() ? teacherNotes.trim() : undefined,
    feedback: feedback || undefined,
    // Publication is only allowed through the dedicated verified publish endpoint.
    status: 'draft',
    publishedAt: undefined,
  });

  return res.status(201).json({ assessment: newAssessment });
});

apiRouter.put('/assessments/:id', requireAuth, requireTeacher, (req: Request, res: Response) => {
  const assessment = store.findAssessmentById(req.params.id);
  if (!assessment) return res.status(404).json({ error: 'Assessment not found.' });

  const { title, subject, date, topics, teacherNotes, feedback, status } = req.body;
  const updates: Partial<Assessment> = {};

  if (title !== undefined) {
    if (typeof title !== 'string' || !title.trim()) return res.status(400).json({ error: 'Assessment title cannot be empty.' });
    updates.title = title.trim();
  }
  if (subject !== undefined) {
    if (typeof subject !== 'string') return res.status(400).json({ error: 'Subject must be text.' });
    updates.subject = subject.trim() || 'General Assessment';
  }
  if (date !== undefined) {
    if (typeof date !== 'string' || !isValidDateOnly(date)) {
      return res.status(400).json({ error: 'Assessment date must be a valid YYYY-MM-DD date.' });
    }
    updates.date = date;
  }
  if (teacherNotes !== undefined) {
    if (teacherNotes !== null && typeof teacherNotes !== 'string') return res.status(400).json({ error: 'Teacher notes must be text.' });
    updates.teacherNotes = typeof teacherNotes === 'string' && teacherNotes.trim() ? teacherNotes.trim() : undefined;
  }
  if (topics !== undefined) {
    const topicResult = validateAssessmentTopics(topics);
    if (!topicResult.ok) return res.status(400).json({ error: topicResult.error });
    updates.topics = topicResult.topics;
    updates.totalAchieved = topicResult.totalAchieved;
    updates.totalMax = topicResult.totalMax;
    updates.overallPercentage = topicResult.overallPercentage;
    updates.overallGradeLetter = calculateGradeLetter(topicResult.overallPercentage);
  }
  if (feedback !== undefined) {
    if (!validateFeedbackObject(feedback)) return res.status(400).json({ error: 'Feedback fields must be text and use supported metadata values.' });
    updates.feedback = {
      ...assessment.feedback,
      ...feedback,
      lastEditedAt: new Date().toISOString(),
    } as Assessment['feedback'];
  }
  if (status !== undefined) {
    if (status !== 'draft' && status !== 'published') {
      return res.status(400).json({ error: 'Status must be either draft or published.' });
    }
    if (status === 'published') {
      return res.status(400).json({ error: 'Use the dedicated publish endpoint after reviewing all feedback sections.' });
    }
    updates.status = 'draft';
    updates.publishedAt = undefined;
  }

  const updated = store.updateAssessment(req.params.id, updates);
  if (!updated) return res.status(404).json({ error: 'Assessment not found.' });
  return res.json({ assessment: updated });
});

apiRouter.post('/assessments/:id/publish', requireAuth, requireTeacher, (req: Request, res: Response) => {
  const assessment = store.findAssessmentById(req.params.id);
  if (!assessment) return res.status(404).json({ error: 'Assessment not found.' });

  if (!assessment.feedback || !assessment.feedback.strengths?.trim() || !assessment.feedback.growthAreas?.trim() || !assessment.feedback.nextSteps?.trim()) {
    return res.status(400).json({
      error: 'Cannot publish assessment without verified feedback (strengths, growth areas, next steps).',
    });
  }

  const updated = store.updateAssessment(req.params.id, {
    status: 'published',
    publishedAt: assessment.publishedAt || new Date().toISOString(),
  });

  if (!updated) return res.status(404).json({ error: 'Assessment not found.' });
  return res.json({ assessment: updated, message: 'Assessment feedback published to student portal.' });
});

// Student acknowledgment of feedback
apiRouter.post('/assessments/:id/acknowledge', requireAuth, (req: Request, res: Response) => {
  const user = (req as any).user as User;
  if (user.role !== 'student' || !user.studentId) {
    return res.status(403).json({ error: 'Only the assigned student can acknowledge feedback.' });
  }

  const assessment = store.findAssessmentById(req.params.id);
  if (!assessment || assessment.studentId !== user.studentId || assessment.status !== 'published') {
    return res.status(404).json({ error: 'Published assessment not found.' });
  }

  const { reflectionNote } = req.body;
  if (reflectionNote !== undefined && reflectionNote !== null && typeof reflectionNote !== 'string') {
    return res.status(400).json({ error: 'Reflection note must be text.' });
  }
  if (typeof reflectionNote === 'string' && reflectionNote.length > 1000) {
    return res.status(400).json({ error: 'Reflection note must be 1,000 characters or fewer.' });
  }
  const updated = store.acknowledgeAssessment(req.params.id, user.studentId, reflectionNote);
  if (!updated) return res.status(404).json({ error: 'Published assessment not found.' });
  return res.json({ assessment: updated });
});

apiRouter.delete('/assessments/:id', requireAuth, requireTeacher, (req: Request, res: Response) => {
  const success = store.deleteAssessment(req.params.id);
  if (!success) return res.status(404).json({ error: 'Assessment not found.' });
  return res.json({ success: true });
});

// -------------------------------------------------------------
// AI Feedback Generation Endpoint (Teacher only)
// -------------------------------------------------------------

apiRouter.post('/feedback/generate', requireAuth, requireTeacher, async (req: Request, res: Response) => {
  const { assessmentTitle, studentName, topics, teacherNotes, tone } = req.body;
  if (typeof assessmentTitle !== 'string' || !assessmentTitle.trim() ||
      typeof studentName !== 'string' || !studentName.trim()) {
    return res.status(400).json({ error: 'Assessment title and student name are required.' });
  }
  if (teacherNotes !== undefined && teacherNotes !== null && typeof teacherNotes !== 'string') {
    return res.status(400).json({ error: 'Teacher notes must be text.' });
  }
  if (typeof teacherNotes === 'string' && teacherNotes.length > 5000) {
    return res.status(400).json({ error: 'Teacher notes must be 5,000 characters or fewer.' });
  }
  if (tone !== undefined && !['encouraging', 'rigorous', 'foundational'].includes(tone)) {
    return res.status(400).json({ error: 'Tone must be encouraging, rigorous, or foundational.' });
  }

  const topicResult = validateAssessmentTopics(topics);
  if (!topicResult.ok) return res.status(400).json({ error: topicResult.error });

  try {
    const feedback = await generateFeedback({
      assessmentTitle: assessmentTitle.trim(),
      studentName: studentName.trim(),
      topics: topicResult.topics.map(({ name, marksAchieved, marksMax, percentage }) => ({
        name, marksAchieved, marksMax, percentage,
      })),
      // Recompute all score-derived fields on the server rather than trusting client totals.
      overallPercentage: topicResult.overallPercentage,
      teacherNotes: typeof teacherNotes === 'string' ? teacherNotes.trim() : undefined,
      tone: tone || 'encouraging',
    });
    return res.json({ feedback });
  } catch {
    console.error('Feedback generation failed.');
    return res.status(500).json({ error: 'Failed to generate feedback. Please try again.' });
  }
});
