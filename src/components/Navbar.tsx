import React, { useState } from 'react';
import type { User } from '../types/index';
import { SynapseLogo } from './SynapseLogo';
import { LogOut, ChevronDown, Shield } from 'lucide-react';

interface NavbarProps {
  user: User;
  currentTab: string;
  onTabChange: (tab: string) => void;
  onLogout: () => void;
  onOpenNewAssessment?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  currentTab,
  onTabChange,
  onLogout,
  onOpenNewAssessment,
}) => {
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-[#E3E8EF] px-4 sm:px-8 shadow-xs print:hidden">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-8 h-16">
        {/* Zone 1: Brand wordmark with custom ClearFeedback vector logo */}
        <div className="flex items-center gap-3 shrink-0">
          <SynapseLogo size={34} showWordmark={true} wordmarkClassName="text-xl font-bold tracking-tight text-[#14243A]" />
        </div>

        {/* Zone 2: Clean single-line text navigation links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-[#536174]">
          {user.role === 'teacher' ? (
            <>
              <button
                type="button"
                onClick={() => onTabChange('assessments')}
                className={`transition-colors whitespace-nowrap cursor-pointer py-1 border-b-2 ${
                  currentTab === 'assessments'
                    ? 'border-[#147D78] text-[#14243A] font-semibold'
                    : 'border-transparent hover:text-[#14243A]'
                }`}
              >
                Assessments & Feedback
              </button>
              <button
                type="button"
                onClick={() => onTabChange('students')}
                className={`transition-colors whitespace-nowrap cursor-pointer py-1 border-b-2 ${
                  currentTab === 'students'
                    ? 'border-[#147D78] text-[#14243A] font-semibold'
                    : 'border-transparent hover:text-[#14243A]'
                }`}
              >
                Student Roster
              </button>
              <button
                type="button"
                onClick={() => onTabChange('guide')}
                className={`transition-colors whitespace-nowrap cursor-pointer py-1 border-b-2 ${
                  currentTab === 'guide'
                    ? 'border-[#147D78] text-[#14243A] font-semibold'
                    : 'border-transparent hover:text-[#14243A]'
                }`}
              >
                Rubric Framework
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => onTabChange('my-feedback')}
                className={`transition-colors whitespace-nowrap cursor-pointer py-1 border-b-2 ${
                  currentTab === 'my-feedback'
                    ? 'border-[#147D78] text-[#14243A] font-semibold'
                    : 'border-transparent hover:text-[#14243A]'
                }`}
              >
                My Feedback
              </button>
              <button
                type="button"
                onClick={() => onTabChange('how-to-read')}
                className={`transition-colors whitespace-nowrap cursor-pointer py-1 border-b-2 ${
                  currentTab === 'how-to-read'
                    ? 'border-[#147D78] text-[#14243A] font-semibold'
                    : 'border-transparent hover:text-[#14243A]'
                }`}
              >
                Understanding Feedback
              </button>
            </>
          )}
        </nav>

        {/* Zone 3: Primary action and user profile */}
        <div className="flex items-center gap-3 shrink-0">
          {user.role === 'teacher' && onOpenNewAssessment && (
            <button
              type="button"
              onClick={onOpenNewAssessment}
              className="hidden sm:inline-flex items-center justify-center px-4 py-2 text-xs font-semibold text-white bg-[#147D78] hover:bg-[#0f605c] rounded-lg transition-colors shadow-xs cursor-pointer whitespace-nowrap"
            >
              + Prepare Feedback
            </button>
          )}

          {/* User profile dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl border border-[#E3E8EF] hover:bg-[#F7F8FA] text-xs font-medium text-[#14243A] transition-colors cursor-pointer"
              aria-label="User profile"
            >
              <span className="w-6 h-6 rounded-lg bg-[#14243A] text-white flex items-center justify-center font-bold text-[10px]">
                {user.role === 'teacher' ? 'T' : 'S'}
              </span>
              <div className="text-left hidden sm:block">
                <div className="font-semibold leading-tight text-[#14243A] truncate max-w-[120px]">{user.name}</div>
                <div className="text-[10px] text-[#536174] capitalize flex items-center gap-1">
                  <span>{user.role}</span>
                  {user.studentId && <span>· {user.studentId}</span>}
                </div>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-[#536174]" />
            </button>

            {showProfileMenu && (
              <div
                className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-[#E3E8EF] py-2 z-50 text-xs"
                onMouseLeave={() => setShowProfileMenu(false)}
              >
                <div className="px-4 py-3 border-b border-[#E3E8EF] bg-[#F7F8FA]/60">
                  <div className="font-bold text-[#14243A]">{user.name}</div>
                  <div className="text-[#536174] text-[11px] truncate">{user.email}</div>
                  <div className="text-[11px] text-[#147D78] font-semibold mt-1 flex items-center gap-1">
                    <Shield className="w-3 h-3" />
                    Role: {user.role === 'teacher' ? 'Educator' : `Student (${user.studentId})`}
                  </div>
                </div>

                <div className="border-t border-[#E3E8EF] mt-1 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setShowProfileMenu(false);
                      onLogout();
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-red-50 text-red-600 flex items-center gap-2 cursor-pointer font-semibold"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
