import React, { useState } from 'react';
import type { Student } from '../types/index';
import { api } from '../services/apiClient';
import { X, UserPlus, AlertCircle } from 'lucide-react';

interface AddStudentModalProps {
  onClose: () => void;
  onStudentAdded: (student: Student) => void;
}

export const AddStudentModal: React.FC<AddStudentModalProps> = ({
  onClose,
  onStudentAdded,
}) => {
  const [studentId, setStudentId] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [emailManuallyEdited, setEmailManuallyEdited] = useState(false);
  const [gradeLevel, setGradeLevel] = useState('Grade 9');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!studentId.trim()) {
      setError('Student ID is required (e.g. STU-104).');
      return;
    }
    if (!name.trim()) {
      setError('Student full name is required.');
      return;
    }
    if (!email.trim()) {
      setError('Student email address is required.');
      return;
    }

    setIsSubmitting(true);
    try {
      const student = await api.addStudent({
        studentId: studentId.trim().toUpperCase(),
        name: name.trim(),
        email: email.trim().toLowerCase(),
        gradeLevel: gradeLevel.trim(),
      });
      onStudentAdded(student);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to add student. Please check input.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full border border-[#E3E8EF] shadow-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-[#E3E8EF] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#E6F4EE] text-[#147D78] flex items-center justify-center">
              <UserPlus className="w-4 h-4" />
            </div>
            <h2 className="text-base font-bold text-[#14243A]">Add New Student</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close add student dialog"
            className="p-1 rounded-lg text-[#536174] hover:bg-[#F7F8FA] hover:text-[#14243A] cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
              <div>{error}</div>
            </div>
          )}

          <div>
            <label htmlFor="student-name" className="block text-xs font-semibold text-[#14243A] mb-1">
              Student Full Name
            </label>
            <input
              id="student-name"
              type="text"
              required
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                // Keep the suggested address in sync until the user edits it manually.
                if (!emailManuallyEdited) {
                  const slug = e.target.value.trim().toLowerCase().replace(/\s+/g, '.');
                  setEmail(slug ? `${slug}@student.clearfeedback.edu` : '');
                }
              }}
              placeholder="e.g. Jordan Rivera"
              className="w-full px-3 py-2 text-xs border border-[#E3E8EF] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#147D78] text-[#14243A] bg-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="student-id" className="block text-xs font-semibold text-[#14243A] mb-1">
                Student ID
              </label>
              <input
                id="student-id"
                type="text"
                required
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                placeholder="e.g. STU-104"
                className="w-full px-3 py-2 text-xs font-mono uppercase border border-[#E3E8EF] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#147D78] text-[#14243A] bg-white"
              />
            </div>
            <div>
              <label htmlFor="student-grade" className="block text-xs font-semibold text-[#14243A] mb-1">
                Grade Level
              </label>
              <select
                id="student-grade"
                value={gradeLevel}
                onChange={(e) => setGradeLevel(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-[#E3E8EF] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#147D78] text-[#14243A] bg-white cursor-pointer"
              >
                <option value="Grade 8">Grade 8</option>
                <option value="Grade 9">Grade 9</option>
                <option value="Grade 10">Grade 10</option>
                <option value="Grade 11">Grade 11</option>
                <option value="Grade 12">Grade 12</option>
                <option value="Undergraduate">Undergraduate</option>
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="student-email" className="block text-xs font-semibold text-[#14243A] mb-1">
              Student Email (Login Account)
            </label>
            <input
              id="student-email"
              type="email"
              required
              value={email}
              onChange={(e) => { setEmail(e.target.value); setEmailManuallyEdited(true); }}
              placeholder="e.g. jordan.rivera@student.clearfeedback.edu"
              className="w-full px-3 py-2 text-xs border border-[#E3E8EF] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#147D78] text-[#14243A] bg-white"
            />
            <p className="text-[11px] text-[#536174] mt-1">
              A student account is automatically provisioned with password <code className="font-mono">student123</code>.
            </p>
          </div>

          <div className="pt-2 flex items-center justify-end gap-2 border-t border-[#E3E8EF]">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 text-xs font-semibold text-[#536174] hover:text-[#14243A] rounded-lg cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-semibold text-white bg-[#147D78] hover:bg-[#0f605c] rounded-lg shadow-xs transition-colors cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? 'Adding...' : 'Register Student'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
