import React from 'react';
import type { Student, Assessment } from '../types/index';
import { UserPlus, Plus } from 'lucide-react';

interface StudentRosterViewProps {
  students: Student[];
  assessments: Assessment[];
  onOpenAddStudent: () => void;
  onOpenAddAssessment: (studentId?: string) => void;
}

export const StudentRosterView: React.FC<StudentRosterViewProps> = ({
  students,
  assessments,
  onOpenAddStudent,
  onOpenAddAssessment,
}) => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-[#E3E8EF]">
        <div>
          <div className="text-xs font-bold text-[#147D78] uppercase tracking-wider mb-1">
            Student Roster Management · ClearFeedback
          </div>
          <h1 className="text-2xl font-bold text-[#14243A]">
            Active Academic Class Roster
          </h1>
          <p className="text-xs text-[#536174] mt-1">
            Manage student enrollment records and track assessment feedback progress.
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenAddStudent}
          className="px-4 py-2 text-xs font-semibold text-white bg-[#147D78] hover:bg-[#0f605c] rounded-lg shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
        >
          <UserPlus className="w-3.5 h-3.5" />
          Enroll New Student
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-[#E3E8EF] shadow-xs overflow-hidden">
        <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-[#F7F8FA] border-b border-[#E3E8EF] text-xs font-semibold text-[#536174]">
          <div className="col-span-4 sm:col-span-3">Student Name & ID</div>
          <div className="col-span-4 sm:col-span-3">Grade Level & Email</div>
          <div className="hidden sm:block sm:col-span-3">Recorded Assessments</div>
          <div className="col-span-4 sm:col-span-3 text-right">Actions</div>
        </div>

        <div className="divide-y divide-[#E3E8EF]">
          {students.map((student) => {
            const studentAssessments = assessments.filter((a) => a.studentId === student.studentId);
            const published = studentAssessments.filter((a) => a.status === 'published');
            const drafts = studentAssessments.filter((a) => a.status === 'draft');

            return (
              <div key={student.id} className="grid grid-cols-12 gap-4 px-6 py-4 items-center hover:bg-[#F7F8FA]/60 transition-colors">
                <div className="col-span-4 sm:col-span-3">
                  <div className="text-xs font-bold text-[#14243A]">{student.name}</div>
                  <div className="text-[11px] font-mono text-[#536174]">{student.studentId}</div>
                </div>

                <div className="col-span-4 sm:col-span-3">
                  <div className="text-xs text-[#14243A]">{student.gradeLevel}</div>
                  <div className="text-[11px] text-[#536174] truncate">{student.email}</div>
                </div>

                <div className="hidden sm:block sm:col-span-3 text-xs text-[#536174]">
                  <div>
                    {studentAssessments.length} assessment{studentAssessments.length === 1 ? '' : 's'} recorded
                  </div>
                  <div className="text-[11px] mt-0.5">
                    {published.length} published · {drafts.length} in draft
                  </div>
                </div>

                <div className="col-span-4 sm:col-span-3 text-right">
                  <button
                    type="button"
                    onClick={() => onOpenAddAssessment(student.studentId)}
                    className="px-3 py-1.5 text-xs font-semibold text-[#147D78] hover:bg-[#E6F4EE] rounded-lg transition-colors cursor-pointer inline-flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Enter Marks
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
