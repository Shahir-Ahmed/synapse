import React, { useState, useEffect } from 'react';
import type { User, Student, Assessment } from './types/index';
import { api } from './services/apiClient';
import { Navbar } from './components/Navbar';
import { LoginPage } from './components/LoginPage';
import { TeacherWorkspace } from './components/TeacherWorkspace';
import { StudentRosterView } from './components/StudentRosterView';
import { StudentPortal } from './components/StudentPortal';
import { GuidelinesView } from './components/GuidelinesView';
import { AddAssessmentModal } from './components/AddAssessmentModal';
import { FeedbackReviewModal } from './components/FeedbackReviewModal';
import { AddStudentModal } from './components/AddStudentModal';
import { PrintFeedbackSlip } from './components/PrintFeedbackSlip';
import { SynapseLogo } from './components/SynapseLogo';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentTab, setCurrentTab] = useState<string>('assessments');
  const [students, setStudents] = useState<Student[]>([]);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [dataLoadError, setDataLoadError] = useState<string | null>(null);

  // Modals state
  const [isAddAssessmentOpen, setIsAddAssessmentOpen] = useState(false);
  const [targetStudentId, setTargetStudentId] = useState<string | undefined>(undefined);
  const [isAddStudentOpen, setIsAddStudentOpen] = useState(false);
  const [reviewingAssessment, setReviewingAssessment] = useState<Assessment | null>(null);
  const [printingAssessment, setPrintingAssessment] = useState<Assessment | null>(null);

  // Load current session or default to Dr. Sarah Jenkins
  useEffect(() => {
    async function initSession() {
      setIsLoading(true);
      try {
        const user = await api.getMe();
        setCurrentUser(user);
        if (user.role === 'teacher') {
          setCurrentTab('assessments');
        } else {
          setCurrentTab('my-feedback');
        }
      } catch {
        // A missing or expired session should show sign-in and discard stale local credentials.
        api.clearSession();
        setCurrentUser(null);
      } finally {
        setIsLoading(false);
      }
    }
    initSession();
  }, []);

  // Fetch data on session change
  useEffect(() => {
    if (!currentUser) return;

    async function loadData() {
      setIsLoading(true);
      setDataLoadError(null);
      try {
        if (currentUser?.role === 'teacher') {
          const [loadedStudents, loadedAssessments] = await Promise.all([
            api.getStudents(),
            api.getAssessments(),
          ]);
          setStudents(loadedStudents);
          setAssessments(loadedAssessments);
        } else {
          const loadedAssessments = await api.getAssessments();
          setAssessments(loadedAssessments);
        }
      } catch (err) {
        console.error('Failed to load application data.');
        setDataLoadError('Application data could not be loaded. Check your connection and reload the page.');
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, [currentUser]);

  const handleLogout = async () => {
    await api.logout();
    setCurrentUser(null);
    setStudents([]);
    setAssessments([]);
  };

  const handleAssessmentPrepared = async (data: any) => {
    try {
      setIsLoading(true);
      const created = await api.createAssessment({
        ...data,
        status: 'draft',
      });
      setAssessments((prev) => [created, ...prev]);
      setIsAddAssessmentOpen(false);
      setReviewingAssessment(created);
    } catch (err: any) {
      alert(`Failed to save assessment: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAssessmentUpdated = (updated: Assessment) => {
    setAssessments((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
  };

  const handleAssessmentDeleted = (id: string) => {
    setAssessments((prev) => prev.filter((a) => a.id !== id));
  };

  const handleStudentAdded = (newStudent: Student) => {
    setStudents((prev) => [...prev, newStudent]);
  };

  if (!currentUser && isLoading) {
    return (
      <div className="min-h-screen bg-[#F7F8FA] flex items-center justify-center p-6 text-sm text-[#536174]" role="status">Checking your session…</div>
    );
  }

  if (!currentUser) {
    return (
      <LoginPage
        onSuccess={(user) => {
          setCurrentUser(user);
          setCurrentTab(user.role === 'teacher' ? 'assessments' : 'my-feedback');
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F8FA] flex flex-col font-['Plus_Jakarta_Sans',sans-serif] text-[#14243A]">
      {/* Main Navigation */}
      <Navbar
        user={currentUser}
        currentTab={currentTab}
        onTabChange={setCurrentTab}
        onLogout={handleLogout}
        onOpenNewAssessment={
          currentUser.role === 'teacher'
            ? () => {
                setTargetStudentId(undefined);
                setIsAddAssessmentOpen(true);
              }
            : undefined
        }
      />

      {/* Main Content Area */}
      <main className="flex-1 pb-16 print:hidden">
        {dataLoadError && (
          <div role="alert" className="max-w-7xl mx-auto mt-5 px-4 sm:px-6 lg:px-8">
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{dataLoadError}</div>
          </div>
        )}
        {currentUser.role === 'teacher' ? (
          <>
            {currentTab === 'assessments' && (
              <TeacherWorkspace
                user={currentUser}
                students={students}
                assessments={assessments}
                isLoading={isLoading}
                onOpenAddAssessment={(studentId) => {
                  setTargetStudentId(studentId);
                  setIsAddAssessmentOpen(true);
                }}
                onOpenAddStudent={() => setIsAddStudentOpen(true)}
                onReviewAssessment={(asm) => setReviewingAssessment(asm)}
                onOpenPrintSlip={(asm) => setPrintingAssessment(asm)}
                onAssessmentDeleted={handleAssessmentDeleted}
                onAssessmentUpdated={handleAssessmentUpdated}
              />
            )}
            {currentTab === 'students' && (
              <StudentRosterView
                students={students}
                assessments={assessments}
                onOpenAddStudent={() => setIsAddStudentOpen(true)}
                onOpenAddAssessment={(studentId) => {
                  setTargetStudentId(studentId);
                  setIsAddAssessmentOpen(true);
                }}
              />
            )}
            {currentTab === 'guide' && <GuidelinesView role="teacher" />}
          </>
        ) : (
          <>
            {currentTab === 'my-feedback' && (
              <StudentPortal
                user={currentUser}
                assessments={assessments}
                isLoading={isLoading}
                onOpenPrintSlip={(asm) => setPrintingAssessment(asm)}
                onAssessmentUpdated={handleAssessmentUpdated}
              />
            )}
            {currentTab === 'how-to-read' && <GuidelinesView role="student" />}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-[#E3E8EF] py-4 px-6 text-xs text-[#536174] print:hidden">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <SynapseLogo size={20} showWordmark={true} wordmarkClassName="font-bold text-[#14243A]" />
            <span aria-hidden="true">·</span>
            <span>Student Assessment & Feedback</span>
          </div>
          <div>
            Active Account: <span className="font-semibold text-[#14243A]">{currentUser.name}</span> ({currentUser.role})
          </div>
        </div>
      </footer>

      {/* Add Assessment Modal */}
      {isAddAssessmentOpen && (
        <AddAssessmentModal
          students={students}
          initialStudentId={targetStudentId}
          onClose={() => setIsAddAssessmentOpen(false)}
          onAssessmentPrepared={handleAssessmentPrepared}
          onOpenAddStudent={() => {
            setIsAddAssessmentOpen(false);
            setIsAddStudentOpen(true);
          }}
        />
      )}

      {/* Feedback Review Modal */}
      {reviewingAssessment && (
        <FeedbackReviewModal
          assessment={reviewingAssessment}
          onClose={() => setReviewingAssessment(null)}
          onSaved={(updated) => {
            handleAssessmentUpdated(updated);
            setReviewingAssessment(null);
          }}
          onOpenPrintSlip={(asm) => setPrintingAssessment(asm)}
        />
      )}

      {/* Add Student Modal */}
      {isAddStudentOpen && (
        <AddStudentModal
          onClose={() => setIsAddStudentOpen(false)}
          onStudentAdded={handleStudentAdded}
        />
      )}

      {/* Official Print Slip Modal */}
      {printingAssessment && (
        <PrintFeedbackSlip
          assessment={printingAssessment}
          onClose={() => setPrintingAssessment(null)}
        />
      )}
    </div>
  );
}
