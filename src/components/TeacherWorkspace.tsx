import React, { useState } from 'react';
import type { User, Student, Assessment } from '../types/index';
import { api } from '../services/apiClient';
import {
  Plus,
  UserPlus,
  Send,
  Edit3,
  Trash2,
  Sparkles,
  Search,
  Printer,
  CheckCircle2,
  Filter,
} from 'lucide-react';

interface TeacherWorkspaceProps {
  user: User;
  students: Student[];
  assessments: Assessment[];
  isLoading: boolean;
  onOpenAddAssessment: (studentId?: string) => void;
  onOpenAddStudent: () => void;
  onReviewAssessment: (assessment: Assessment) => void;
  onOpenPrintSlip: (assessment: Assessment) => void;
  onAssessmentDeleted: (id: string) => void;
  onAssessmentUpdated: (updated: Assessment) => void;
}

export const TeacherWorkspace: React.FC<TeacherWorkspaceProps> = ({
  user,
  students,
  assessments,
  isLoading,
  onOpenAddAssessment,
  onOpenAddStudent,
  onReviewAssessment,
  onOpenPrintSlip,
  onAssessmentDeleted,
  onAssessmentUpdated,
}) => {
  const [filterStatus, setFilterStatus] = useState<'all' | 'draft' | 'published'>('all');
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [publishingId, setPublishingId] = useState<string | null>(null);

  // Extract distinct subjects
  const subjects = Array.from(new Set(assessments.map((a) => a.subject || 'General').filter(Boolean)));

  // Filter assessments
  const filteredAssessments = assessments.filter((a) => {
    const matchesStatus = filterStatus === 'all' || a.status === filterStatus;
    const matchesSubject = selectedSubject === 'all' || (a.subject || 'General') === selectedSubject;
    const matchesSearch =
      a.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.studentId.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSubject && matchesSearch;
  });

  const draftCount = assessments.filter((a) => a.status === 'draft').length;
  const publishedCount = assessments.filter((a) => a.status === 'published').length;

  const handleQuickPublish = async (assessment: Assessment) => {
    if (!assessment.feedback) {
      onReviewAssessment(assessment);
      return;
    }
    setPublishingId(assessment.id);
    try {
      const published = await api.publishAssessment(assessment.id);
      onAssessmentUpdated(published);
    } catch (err: any) {
      alert(err.message || 'Failed to publish assessment');
    } finally {
      setPublishingId(null);
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!window.confirm(`Are you sure you want to remove assessment "${title}"?`)) {
      return;
    }
    try {
      await api.deleteAssessment(id);
      onAssessmentDeleted(id);
    } catch (err: any) {
      alert(err.message || 'Failed to delete assessment');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Workspace Header Strip */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-[#E3E8EF]">
        <div>
          <div className="text-xs font-bold text-[#147D78] uppercase tracking-wider mb-1">
            Teacher Evaluation Workspace · ClearFeedback
          </div>
          <h1 className="text-2xl font-bold text-[#14243A]">
            Assessment Feedback & Evaluation
          </h1>
          <p className="text-xs text-[#536174] mt-1">
            Score assessments by topic, generate evidence-backed drafts, review, and publish directly to student portals.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onOpenAddStudent}
            className="px-3.5 py-2 text-xs font-semibold text-[#14243A] bg-white border border-[#E3E8EF] hover:bg-[#F7F8FA] rounded-lg shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <UserPlus className="w-3.5 h-3.5 text-[#536174]" />
            Add Student
          </button>

          <button
            type="button"
            onClick={() => onOpenAddAssessment()}
            className="px-4 py-2 text-xs font-semibold text-white bg-[#147D78] hover:bg-[#0f605c] rounded-lg shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            Prepare Assessment Feedback
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* Segmented Filter Control */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 p-1 bg-[#F7F8FA] rounded-xl border border-[#E3E8EF]">
            <button
              type="button"
              onClick={() => setFilterStatus('all')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                filterStatus === 'all'
                  ? 'bg-white text-[#14243A] shadow-xs font-bold'
                  : 'text-[#536174] hover:text-[#14243A]'
              }`}
            >
              All Assessments ({assessments.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterStatus('draft')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
                filterStatus === 'draft'
                  ? 'bg-white text-amber-900 shadow-xs font-bold'
                  : 'text-[#536174] hover:text-[#14243A]'
              }`}
            >
              Pending Review ({draftCount})
            </button>
            <button
              type="button"
              onClick={() => setFilterStatus('published')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
                filterStatus === 'published'
                  ? 'bg-white text-[#147D78] shadow-xs font-bold'
                  : 'text-[#536174] hover:text-[#14243A]'
              }`}
            >
              Published ({publishedCount})
            </button>
          </div>

          {/* Subject Filter Dropdown */}
          {subjects.length > 0 && (
            <div className="flex items-center gap-1 text-xs">
              <Filter className="w-3.5 h-3.5 text-[#536174]" />
              <select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="px-2.5 py-1.5 text-xs border border-[#E3E8EF] rounded-xl bg-white text-[#14243A] focus:outline-none focus:ring-1 focus:ring-[#147D78] cursor-pointer"
              >
                <option value="all">All Subjects</option>
                {subjects.map((sub) => (
                  <option key={sub} value={sub}>{sub}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Search input */}
        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-[#536174] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search student or assessment..."
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-[#E3E8EF] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#147D78] text-[#14243A] bg-white"
          />
        </div>
      </div>

      {/* Assessments List / Table */}
      {isLoading ? (
        <div className="bg-white rounded-2xl border border-[#E3E8EF] p-12 text-center text-xs text-[#536174]">
          Loading assessments and student records...
        </div>
      ) : filteredAssessments.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#E3E8EF] p-12 text-center max-w-md mx-auto space-y-3">
          <div className="w-10 h-10 rounded-full bg-[#F7F8FA] border border-[#E3E8EF] text-[#536174] flex items-center justify-center mx-auto">
            <Sparkles className="w-5 h-5 text-[#147D78]" />
          </div>
          <h2 className="text-sm font-bold text-[#14243A]">No Assessments Found</h2>
          <p className="text-xs text-[#536174]">
            {searchQuery
              ? 'No assessments match your current search query.'
              : filterStatus === 'draft'
              ? 'No draft assessments currently pending review.'
              : 'Begin by entering assessment marks for a student.'}
          </p>
          <button
            type="button"
            onClick={() => onOpenAddAssessment()}
            className="px-3.5 py-2 text-xs font-semibold text-white bg-[#147D78] hover:bg-[#0f605c] rounded-lg shadow-xs transition-colors cursor-pointer inline-flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            Prepare Feedback Now
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-[#E3E8EF] shadow-xs overflow-hidden">
          <div className="divide-y divide-[#E3E8EF]">
            {filteredAssessments.map((asm) => {
              const isDraft = asm.status === 'draft';
              return (
                <div
                  key={asm.id}
                  className="p-5 hover:bg-[#F7F8FA]/60 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  {/* Left: Student & Assessment Details */}
                  <div className="space-y-1.5 min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-bold text-[#14243A]">
                        {asm.studentName}
                      </span>
                      <span className="text-xs text-[#536174]">·</span>
                      <span className="text-xs font-mono text-[#536174]">
                        {asm.studentId}
                      </span>
                      <span className="text-xs text-[#536174]">·</span>
                      <span className="text-xs font-semibold text-[#536174]">
                        {asm.subject || 'General'}
                      </span>
                      <span className="text-xs text-[#536174]">·</span>
                      {/* Unboxed Status Label (Zero-Pill Discipline) */}
                      <span
                        className={`text-xs font-semibold ${
                          isDraft ? 'text-amber-800 bg-[#FFF3D6] px-2 py-0.5 rounded' : 'text-[#147D78] bg-[#E6F4EE] px-2 py-0.5 rounded'
                        }`}
                      >
                        {isDraft ? 'Draft · Pending Review' : 'Published to Student'}
                      </span>

                      {asm.studentReflection && (
                        <span className="text-xs text-[#147D78] font-medium flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Acknowledged
                        </span>
                      )}
                    </div>

                    <div className="text-xs font-semibold text-[#14243A]">
                      {asm.title}
                    </div>

                    {/* Topic Scores Breakdown Mini-Strip */}
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-[#536174] pt-1">
                      <span>Date: {asm.date}</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono tabular-nums font-semibold text-[#14243A]">
                        Score: {asm.totalAchieved}/{asm.totalMax} ({asm.overallPercentage.toFixed(1)}% · Grade {asm.overallGradeLetter || 'B'})
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>
                        {asm.topics.length} topic{asm.topics.length === 1 ? '' : 's'}:{' '}
                        {asm.topics.map((t) => `${t.name} (${t.percentage.toFixed(0)}%)`).join(', ')}
                      </span>
                    </div>

                    {/* Draft Snippet */}
                    {asm.feedback && (
                      <div className="text-[11px] text-[#536174] line-clamp-1 italic mt-1 bg-[#F7F8FA] p-1.5 rounded border border-[#E3E8EF]/60">
                        "{asm.feedback.strengths.slice(0, 110)}..."
                      </div>
                    )}
                  </div>

                  {/* Right: Actions */}
                  <div className="flex items-center gap-2 shrink-0 pt-2 md:pt-0">
                    <button
                      type="button"
                      onClick={() => onReviewAssessment(asm)}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
                        isDraft
                          ? 'bg-[#147D78] hover:bg-[#0f605c] text-white shadow-xs'
                          : 'bg-white border border-[#E3E8EF] hover:bg-[#F7F8FA] text-[#14243A]'
                      }`}
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      {isDraft ? 'Review & Publish' : 'Edit Feedback'}
                    </button>

                    {isDraft ? (
                      <button
                        type="button"
                        disabled={publishingId === asm.id}
                        onClick={() => handleQuickPublish(asm)}
                        className="px-3 py-1.5 text-xs font-semibold text-[#147D78] bg-[#E6F4EE] hover:bg-[#d5eee2] rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                      >
                        <Send className="w-3.5 h-3.5" />
                        {publishingId === asm.id ? 'Publishing...' : 'Publish'}
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => onOpenPrintSlip(asm)}
                        className="px-2.5 py-1.5 text-xs font-semibold text-[#536174] bg-white border border-[#E3E8EF] hover:bg-[#F7F8FA] hover:text-[#14243A] rounded-lg transition-colors cursor-pointer flex items-center gap-1 shadow-xs"
                        title="Print / Save PDF Slip"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        Print
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => handleDelete(asm.id, asm.title)}
                      className="p-1.5 text-[#536174] hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                      title="Delete assessment"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
