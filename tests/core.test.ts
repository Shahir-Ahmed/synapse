import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { calculateGradeLetter } from '../src/types/index.ts';
import { MemoryStore } from '../server/store.ts';
import { isPasswordHash, verifyPassword } from '../server/passwords.ts';
import { isValidDateOnly, validateAssessmentTopics, validateFeedbackObject } from '../server/assessmentValidation.ts';

function withTemporaryStore<T>(run: (store: MemoryStore, directory: string) => T): T {
  const directory = mkdtempSync(path.join(tmpdir(), 'clearfeedback-test-'));
  try {
    const store = new MemoryStore(directory);
    return run(store, directory);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
}

test('grade boundaries are deterministic', () => {
  assert.equal(calculateGradeLetter(100), 'A');
  assert.equal(calculateGradeLetter(93), 'A');
  assert.equal(calculateGradeLetter(92.9), 'A-');
  assert.equal(calculateGradeLetter(87), 'B+');
  assert.equal(calculateGradeLetter(80), 'B-');
  assert.equal(calculateGradeLetter(60), 'D');
  assert.equal(calculateGradeLetter(59.9), 'F');
});

test('seed accounts are usable and passwords are stored as scrypt hashes', () => {
  withTemporaryStore((store) => {
    const teacher = store.findUserByEmail('SARAH.JENKINS@CLEARFEEDBACK.EDU');
    const student = store.findUserByEmail('alex.chen@student.clearfeedback.edu');
    assert.ok(teacher);
    assert.ok(student);
    assert.ok(isPasswordHash(teacher.passwordHash));
    assert.ok(isPasswordHash(student.passwordHash));
    assert.equal(verifyPassword('teacher123', teacher.passwordHash), true);
    assert.equal(verifyPassword('wrong-password', teacher.passwordHash), false);
    assert.equal(verifyPassword('student123', student.passwordHash), true);
  });
});

test('legacy plaintext passwords are upgraded on store load', () => {
  const directory = mkdtempSync(path.join(tmpdir(), 'clearfeedback-legacy-'));
  try {
    writeFileSync(path.join(directory, 'store.json'), JSON.stringify({
      users: [{ id: 'legacy-1', name: 'Legacy User', email: 'legacy@example.com', passwordHash: 'legacy-pass', role: 'student', studentId: 'STU-900' }],
      students: [],
      assessments: [],
    }), 'utf8');

    const store = new MemoryStore(directory);
    const user = store.findUserByEmail('legacy@example.com');
    assert.ok(user);
    assert.notEqual(user.passwordHash, 'legacy-pass');
    assert.ok(isPasswordHash(user.passwordHash));
    assert.equal(verifyPassword('legacy-pass', user.passwordHash), true);
    const persisted = JSON.parse(readFileSync(path.join(directory, 'store.json'), 'utf8'));
    assert.ok(persisted.users[0].passwordHash.startsWith('scrypt$'));
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test('student creation normalizes IDs and emails and rejects duplicate identities', () => {
  withTemporaryStore((store) => {
    const added = store.addStudent({
      studentId: 'stu-201',
      name: 'Jordan Rivera',
      email: 'Jordan.Rivera@Example.com',
      gradeLevel: 'Grade 9',
      schoolName: 'Example School',
    });

    assert.equal(added.studentId, 'STU-201');
    assert.equal(added.email, 'jordan.rivera@example.com');
    const studentUser = store.findUserByEmail('JORDAN.RIVERA@example.com');
    assert.ok(studentUser);
    assert.ok(isPasswordHash(studentUser.passwordHash));
    assert.equal(verifyPassword('student123', studentUser.passwordHash), true);

    assert.throws(() => store.addStudent({
      studentId: 'STU-201', name: 'Duplicate ID', email: 'another@example.com', gradeLevel: 'Grade 9',
    }), /already exists/i);
    assert.throws(() => store.addStudent({
      studentId: 'STU-202', name: 'Duplicate Email', email: 'jordan.rivera@example.com', gradeLevel: 'Grade 9',
    }), /already exists/i);
  });
});

test('student registration creates a unique roster ID and hashed password', () => {
  withTemporaryStore((store) => {
    const user = store.registerUser({
      name: 'New Student', email: 'new.student@example.com', password: 'a-long-test-password', role: 'student',
    });
    assert.ok(user.studentId);
    assert.match(user.studentId, /^STU-/);
    const rosterEntry = store.getStudents().find((student) => student.studentId === user.studentId);
    assert.ok(rosterEntry);
    assert.equal(rosterEntry.email, 'new.student@example.com');
    const storedUser = store.findUserByEmail('new.student@example.com');
    assert.ok(storedUser);
    assert.ok(isPasswordHash(storedUser.passwordHash));
    assert.equal(verifyPassword('a-long-test-password', storedUser.passwordHash), true);

    assert.throws(() => store.registerUser({
      name: 'Duplicate Email', email: 'NEW.STUDENT@example.com', password: 'different-pass', role: 'teacher',
    }), /already exists/i);
    assert.throws(() => store.registerUser({
      name: 'Duplicate ID', email: 'another.student@example.com', password: 'different-pass', role: 'student', studentId: 'stu-101',
    }), /already exists/i);
  });
});

test('assessment create, acknowledge, update, and delete persist correctly', () => {
  withTemporaryStore((store) => {
    const assessment = store.addAssessment({
      studentId: 'STU-101',
      studentName: 'Alex Chen',
      teacherId: 'teacher-1',
      teacherName: 'Sarah Jenkins, M.Ed.',
      title: 'Test Assessment',
      subject: 'Science',
      date: '2026-10-22',
      topics: [{ id: 'topic-test', name: 'Cells', marksAchieved: 8, marksMax: 10, percentage: 80, gradeLetter: 'B-' }],
      totalAchieved: 8,
      totalMax: 10,
      overallPercentage: 80,
      overallGradeLetter: 'B-',
      status: 'published',
      feedback: { strengths: 'Good', growthAreas: 'Review', nextSteps: 'Practice', generatedBy: 'rule_engine', generatedAt: new Date().toISOString() },
    });

    assert.match(assessment.id, /^asm-/);
    const ack = store.acknowledgeAssessment(assessment.id, 'STU-101', '  I will review.  ');
    assert.equal(ack?.studentReflection?.reflectionNote, 'I will review.');
    assert.equal(ack?.studentReflection?.acknowledgedAt ? true : false, true);

    const updated = store.updateAssessment(assessment.id, { status: 'draft', title: 'Updated Assessment' });
    assert.equal(updated?.title, 'Updated Assessment');
    assert.equal(updated?.status, 'draft');
    assert.equal(store.deleteAssessment(assessment.id), true);
    assert.equal(store.findAssessmentById(assessment.id), undefined);
  });
});


test('assessment validation rejects missing, non-finite, negative, and impossible marks', () => {
  assert.equal(validateAssessmentTopics([]).ok, false);
  assert.equal(validateAssessmentTopics(null).ok, false);
  assert.equal(validateAssessmentTopics([{ name: 'Biology', marksAchieved: 2, marksMax: 0 }]).ok, false);
  assert.equal(validateAssessmentTopics([{ name: 'Biology', marksAchieved: -1, marksMax: 10 }]).ok, false);
  assert.equal(validateAssessmentTopics([{ name: 'Biology', marksAchieved: 11, marksMax: 10 }]).ok, false);
  assert.equal(validateAssessmentTopics([{ name: 'Biology', marksAchieved: Infinity, marksMax: 10 }]).ok, false);
  assert.equal(validateAssessmentTopics([{ name: 'Biology', marksAchieved: true, marksMax: 10 }]).ok, false);
  assert.equal(validateAssessmentTopics([{ name: 'Biology', marksAchieved: 2, marksMax: false }]).ok, false);
  assert.equal(validateAssessmentTopics([{ name: '   ', marksAchieved: 2, marksMax: 10 }]).ok, false);

  const result = validateAssessmentTopics([
    { name: 'Biology', marksAchieved: 8, marksMax: 10, percentage: 999 },
    { name: 'Chemistry', marksAchieved: 18, marksMax: 30, percentage: -500 },
  ]);
  assert.equal(result.ok, true);
  if (result.ok) {
    assert.equal(result.totalAchieved, 26);
    assert.equal(result.totalMax, 40);
    assert.equal(result.overallPercentage, 65);
    assert.equal(result.topics[0].percentage, 80);
    assert.equal(result.topics[1].percentage, 60);
  }
});

test('date and feedback validators accept valid inputs and reject malformed values', () => {
  assert.equal(isValidDateOnly('2026-10-22'), true);
  assert.equal(isValidDateOnly('2026-02-31'), false);
  assert.equal(isValidDateOnly('22-10-2026'), false);
  assert.equal(validateFeedbackObject({ strengths: 'Good', growthAreas: 'Review', nextSteps: 'Practice', generatedBy: 'rule_engine' }, true), true);
  assert.equal(validateFeedbackObject({ strengths: 'Good', growthAreas: '', nextSteps: 'Practice' }, true), false);
  assert.equal(validateFeedbackObject({ strengths: 'Good', growthAreas: '', nextSteps: 'Practice' }), true);
  assert.equal(validateFeedbackObject({ strengths: 'Good', growthAreas: '', nextSteps: 123 }, true), false);
  assert.equal(validateFeedbackObject({ strengths: 'Good', generatedBy: 'unknown-model' }), false);
});
