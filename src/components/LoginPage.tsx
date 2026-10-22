import React, { useState } from 'react';
import { api } from '../services/apiClient';
import type { User } from '../types/index';
import { SynapseLogo } from './SynapseLogo';
import { ShieldCheck, BookOpen, AlertCircle, ArrowRight, UserPlus, LogIn } from 'lucide-react';

interface LoginPageProps {
  onSuccess: (user: User) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onSuccess }) => {
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [selectedRole, setSelectedRole] = useState<'teacher' | 'student'>('teacher');
  const [email, setEmail] = useState('sarah.jenkins@clearfeedback.edu');
  const [password, setPassword] = useState('teacher123');
  const [fullName, setFullName] = useState('');
  const [studentId, setStudentId] = useState('');
  const [gradeLevel, setGradeLevel] = useState('Grade 9');
  const [schoolName, setSchoolName] = useState('Westfield STEM Academy');
  const [teacherRegistrationCode, setTeacherRegistrationCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleRoleTabChange = (role: 'teacher' | 'student') => {
    setSelectedRole(role);
    setErrorMessage(null);
    if (authMode === 'login') {
      if (role === 'teacher') {
        setEmail('sarah.jenkins@clearfeedback.edu');
        setPassword('teacher123');
      } else {
        setEmail('alex.chen@student.clearfeedback.edu');
        setPassword('student123');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!email.trim() || !password.trim()) {
      setErrorMessage('Please enter both your email address and password.');
      return;
    }

    setIsLoading(true);
    try {
      if (authMode === 'login') {
        const res = await api.login(email.trim(), password);
        onSuccess(res.user);
      } else {
        if (!fullName.trim()) {
          throw new Error('Please enter your full name.');
        }
        const res = await api.register({
          name: fullName.trim(),
          email: email.trim(),
          password,
          role: selectedRole,
          studentId: selectedRole === 'student' ? (studentId.trim() || undefined) : undefined,
          gradeLevel: selectedRole === 'student' ? gradeLevel : undefined,
          schoolName: schoolName.trim(),
          teacherRegistrationCode: selectedRole === 'teacher' ? teacherRegistrationCode : undefined,
        });
        onSuccess(res.user);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Authentication failed. Please verify your details.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickDemo = async (role: 'teacher' | 'student', targetEmail: string) => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const res = await api.demoSwitch(role, targetEmail);
      onSuccess(res.user);
    } catch (err: any) {
      setErrorMessage(err.message || 'Demo login failed.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F8FA] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        {/* ClearFeedback Brand Lockup */}
        <div className="flex justify-center mb-3">
          <SynapseLogo size={48} showWordmark={true} wordmarkClassName="text-2xl font-bold tracking-tight text-[#14243A] ml-1" />
        </div>

        <h2 className="text-sm font-semibold text-[#536174] uppercase tracking-wider">
          Student Assessment & Feedback Intelligence
        </h2>
        <p className="mt-1 text-xs text-[#536174]">
          Turning verified rubric scores into personalized, actionable guidance
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-sm border border-[#E3E8EF] rounded-2xl sm:px-10">
          {/* Mode Switcher: Sign In vs Register */}
          <div className="flex items-center justify-between pb-4 mb-5 border-b border-[#E3E8EF]">
            <div className="text-sm font-bold text-[#14243A]">
              {authMode === 'login' ? 'Sign In to Your Account' : 'Create ClearFeedback Account'}
            </div>
            <button
              type="button"
              onClick={() => {
                setAuthMode(authMode === 'login' ? 'register' : 'login');
                setErrorMessage(null);
              }}
              className="text-xs font-semibold text-[#147D78] hover:underline cursor-pointer"
            >
              {authMode === 'login' ? 'New here? Register' : 'Existing account? Sign In'}
            </button>
          </div>

          {/* Segmented Role Selector */}
          <div className="flex p-1 bg-[#F7F8FA] rounded-xl border border-[#E3E8EF] mb-5">
            <button
              type="button"
              onClick={() => handleRoleTabChange('teacher')}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-2 ${
                selectedRole === 'teacher'
                  ? 'bg-white text-[#14243A] shadow-xs'
                  : 'text-[#536174] hover:text-[#14243A]'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              Teacher / Educator
            </button>
            <button
              type="button"
              onClick={() => handleRoleTabChange('student')}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-2 ${
                selectedRole === 'student'
                  ? 'bg-white text-[#14243A] shadow-xs'
                  : 'text-[#536174] hover:text-[#14243A]'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              Student Portal
            </button>
          </div>

          {errorMessage && (
            <div className="mb-5 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
              <div>{errorMessage}</div>
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            {authMode === 'register' && (
              <div>
                <label className="block text-xs font-semibold text-[#14243A] mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder={selectedRole === 'teacher' ? 'e.g. Dr. Arthur Vance' : 'e.g. Jordan Rivera'}
                  className="w-full px-3 py-2 text-xs border border-[#E3E8EF] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#147D78] text-[#14243A] bg-white"
                />
              </div>
            )}

            {authMode === 'register' && selectedRole === 'teacher' && (
              <div>
                <label htmlFor="teacher-registration-code" className="block text-xs font-semibold text-[#14243A] mb-1">
                  Institution Registration Code (for protected deployments)
                </label>
                <input
                  id="teacher-registration-code"
                  type="password"
                  value={teacherRegistrationCode}
                  onChange={(e) => setTeacherRegistrationCode(e.target.value)}
                  autoComplete="off"
                  placeholder="Provided by your administrator, if required"
                  className="w-full px-3 py-2 text-xs border border-[#E3E8EF] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#147D78] text-[#14243A] bg-white"
                />
              </div>
            )}

            {authMode === 'register' && selectedRole === 'student' && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#14243A] mb-1">
                    Student ID
                  </label>
                  <input
                    type="text"
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value)}
                    placeholder="e.g. STU-105"
                    className="w-full px-3 py-2 text-xs font-mono uppercase border border-[#E3E8EF] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#147D78] text-[#14243A] bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#14243A] mb-1">
                    Grade Level
                  </label>
                  <select
                    value={gradeLevel}
                    onChange={(e) => setGradeLevel(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-[#E3E8EF] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#147D78] text-[#14243A] bg-white"
                  >
                    <option value="Grade 8">Grade 8</option>
                    <option value="Grade 9">Grade 9</option>
                    <option value="Grade 10">Grade 10</option>
                    <option value="Grade 11">Grade 11</option>
                    <option value="Grade 12">Grade 12</option>
                  </select>
                </div>
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-xs font-semibold text-[#14243A] mb-1">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@school.edu"
                className="w-full px-3 py-2 text-xs border border-[#E3E8EF] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#147D78] text-[#14243A] bg-white transition-all"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-semibold text-[#14243A] mb-1">
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3 py-2 text-xs border border-[#E3E8EF] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#147D78] text-[#14243A] bg-white transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 flex items-center justify-center gap-2 px-4 py-2.5 bg-[#147D78] hover:bg-[#0f605c] text-white text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer disabled:opacity-50"
            >
              {isLoading ? (
                'Processing...'
              ) : authMode === 'login' ? (
                <>
                  <LogIn className="w-3.5 h-3.5" />
                  Sign In as {selectedRole === 'teacher' ? 'Educator' : 'Student'}
                </>
              ) : (
                <>
                  <UserPlus className="w-3.5 h-3.5" />
                  Register Account
                </>
              )}
            </button>
          </form>

          {/* Instant Evaluation Demo Logins */}
          <div className="mt-8 pt-6 border-t border-[#E3E8EF]">
            <div className="text-xs font-bold text-[#14243A] mb-1">
              One-Click Demonstration Logins
            </div>
            <p className="text-[11px] text-[#536174] mb-3">
              Instant login with verified assessment data:
            </p>

            <div className="space-y-2">
              <button
                type="button"
                onClick={() => handleQuickDemo('teacher', 'sarah.jenkins@clearfeedback.edu')}
                className="w-full text-left p-2.5 rounded-xl border border-[#E3E8EF] hover:border-[#147D78] hover:bg-[#F7F8FA] transition-all flex items-center justify-between cursor-pointer"
              >
                <div>
                  <div className="text-xs font-semibold text-[#14243A]">
                    Sarah Jenkins, M.Ed. <span className="font-normal text-[#536174]">(Teacher)</span>
                  </div>
                  <div className="text-[11px] text-[#536174]">
                    Assess topic marks · Review & publish drafts
                  </div>
                </div>
                <span className="text-xs font-bold text-[#147D78]">Enter &rarr;</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickDemo('student', 'alex.chen@student.clearfeedback.edu')}
                className="w-full text-left p-2.5 rounded-xl border border-[#E3E8EF] hover:border-[#147D78] hover:bg-[#F7F8FA] transition-all flex items-center justify-between cursor-pointer"
              >
                <div>
                  <div className="text-xs font-semibold text-[#14243A]">
                    Alex Chen <span className="font-normal text-[#536174]">(Student · STU-101)</span>
                  </div>
                  <div className="text-[11px] text-[#536174]">
                    View published Biology feedback (83.8%)
                  </div>
                </div>
                <span className="text-xs font-bold text-[#147D78]">Enter &rarr;</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickDemo('student', 'maya.patel@student.clearfeedback.edu')}
                className="w-full text-left p-2.5 rounded-xl border border-[#E3E8EF] hover:border-[#147D78] hover:bg-[#F7F8FA] transition-all flex items-center justify-between cursor-pointer"
              >
                <div>
                  <div className="text-xs font-semibold text-[#14243A]">
                    Maya Patel <span className="font-normal text-[#536174]">(Student · STU-102)</span>
                  </div>
                  <div className="text-[11px] text-[#536174]">
                    Tests privacy (Math feedback is currently draft)
                  </div>
                </div>
                <span className="text-xs font-bold text-[#147D78]">Enter &rarr;</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
