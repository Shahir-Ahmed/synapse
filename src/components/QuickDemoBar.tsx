import React from 'react';
import type { User } from '../types/index';

interface QuickDemoBarProps {
  currentUser: User | null;
  onSwitchRole: (role: 'teacher' | 'student', email?: string) => void;
}

export const QuickDemoBar: React.FC<QuickDemoBarProps> = ({ currentUser, onSwitchRole }) => {
  return (
    <aside aria-label="Demo role selector" className="bg-[#14243A] text-white text-xs py-2 px-4 border-b border-white/10">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-slate-300">
          <span className="font-bold text-white">Evaluation Persona Switcher:</span>
          <span className="hidden sm:inline">Click any account to immediately test access and workflows:</span>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => onSwitchRole('teacher', 'sarah.jenkins@clearfeedback.edu')}
            className={`px-2.5 py-1 rounded text-xs transition-colors cursor-pointer ${
              currentUser?.role === 'teacher'
                ? 'bg-[#147D78] text-white shadow-xs font-bold'
                : 'bg-white/10 text-slate-300 hover:text-white hover:bg-white/20'
            }`}
          >
            Teacher: Sarah Jenkins, M.Ed. (Score & Publish)
          </button>

          <span className="text-slate-500" aria-hidden="true">|</span>

          <button
            type="button"
            onClick={() => onSwitchRole('student', 'alex.chen@student.clearfeedback.edu')}
            className={`px-2.5 py-1 rounded text-xs transition-colors cursor-pointer ${
              currentUser?.role === 'student' && currentUser?.studentId === 'STU-101'
                ? 'bg-[#147D78] text-white shadow-xs font-bold'
                : 'bg-white/10 text-slate-300 hover:text-white hover:bg-white/20'
            }`}
          >
            Student: Alex Chen (View Biology 83.8%)
          </button>

          <span className="text-slate-500" aria-hidden="true">|</span>

          <button
            type="button"
            onClick={() => onSwitchRole('student', 'maya.patel@student.clearfeedback.edu')}
            className={`px-2.5 py-1 rounded text-xs transition-colors cursor-pointer ${
              currentUser?.role === 'student' && currentUser?.studentId === 'STU-102'
                ? 'bg-[#147D78] text-white shadow-xs font-bold'
                : 'bg-white/10 text-slate-300 hover:text-white hover:bg-white/20'
            }`}
          >
            Student: Maya Patel (Math Draft Pending)
          </button>
        </div>
      </div>
    </aside>
  );
};
