import React, { useState } from 'react';
import type { User, Assessment } from '../types/index';
import { api } from '../services/apiClient';
import { CheckCircle2, AlertCircle, ArrowRight, BookOpen, Clock, Printer, Check } from 'lucide-react';

interface StudentPortalProps {
  user: User;
  assessments: Assessment[];
  isLoading: boolean;
  onOpenPrintSlip: (assessment: Assessment) => void;
  onAssessmentUpdated?: (updated: Assessment) => void;
}

export const StudentPortal: React.FC<StudentPortalProps> = ({
  user,
  assessments,
  isLoading,
  onOpenPrintSlip,
  onAssessmentUpdated,
}) => {
  const [selectedAssessmentId, setSelectedAssessmentId] = useState<string | null>(
    assessments.length > 0 ? assessments[0].id : null
  );
  const [reflectionInput, setReflectionInput] = useState('');
  const [isSubmittingAck, setIsSubmittingAck] = useState(false);
  const [showAckInput, setShowAckInput] = useState(false);

  const activeAssessment = assessments.find((a) => a.id === selectedAssessmentId) || assessments[0];

  const handleAcknowledge = async () => {
    if (!activeAssessment) return;
    setIsSubmittingAck(true);
    try {
      const updated = await api.acknowledgeAssessment(activeAssessment.id, reflectionInput.trim());
      if (onAssessmentUpdated) {
        onAssessmentUpdated(updated);
      }
      setShowAckInput(false);
      setReflectionInput('');
    } catch (err: any) {
      alert(`Failed to record acknowledgment: ${err.message}`);
    } finally {
      setIsSubmittingAck(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Welcome Kicker */}
      <div className="bg-white rounded-2xl border border-[#E3E8EF] p-6 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="text-xs font-bold text-[#147D78] uppercase tracking-wider mb-1">
            Student Assessment Portal · ClearFeedback
          </div>
          <h1 className="text-xl font-bold text-[#14243A]">
            Welcome, {user.name}
          </h1>
          <div className="flex items-center gap-2 text-xs text-[#536174] mt-1">
            <span>Student ID: <strong className="text-[#14243A]">{user.studentId}</strong></span>
            <span aria-hidden="true">·</span>
            <span>{user.gradeLevel || 'Grade 9'}</span>
            <span aria-hidden="true">·</span>
            <span>{assessments.length} Published Assessment{assessments.length === 1 ? '' : 's'}</span>
          </div>
        </div>

        <div className="text-xs text-[#536174] bg-[#F7F8FA] px-3.5 py-2 rounded-xl border border-[#E3E8EF] max-w-sm">
          Review your verified topic results, celebrate your mastery, and follow your instructor's targeted recommendations.
        </div>
      </div>

      {isLoading ? (
        <div className="bg-white rounded-2xl border border-[#E3E8EF] p-12 text-center text-xs text-[#536174]">
          Loading your published feedback...
        </div>
      ) : assessments.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#E3E8EF] p-12 text-center max-w-lg mx-auto space-y-3">
          <div className="w-12 h-12 rounded-full bg-[#E6F4EE] text-[#147D78] flex items-center justify-center mx-auto">
            <BookOpen className="w-6 h-6" />
          </div>
          <h2 className="text-base font-bold text-[#14243A]">No Published Feedback Yet</h2>
          <p className="text-xs text-[#536174] leading-relaxed">
            Your instructor has not published feedback for you yet, or your latest assessment draft is currently undergoing teacher review. As soon as your teacher authorizes and publishes your feedback note, it will appear here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Assessment List Sidebar */}
          <div className="lg:col-span-4 space-y-3">
            <div className="text-xs font-bold text-[#14243A] uppercase tracking-wider px-1">
              Your Assessments
            </div>

            <div className="space-y-2">
              {assessments.map((asm) => {
                const isSelected = activeAssessment?.id === asm.id;
                return (
                  <button
                    key={asm.id}
                    type="button"
                    onClick={() => {
                      setSelectedAssessmentId(asm.id);
                      setShowAckInput(false);
                    }}
                    className={`w-full text-left p-4 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-white border-[#147D78] shadow-xs ring-1 ring-[#147D78]'
                        : 'bg-white border-[#E3E8EF] hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="text-xs font-bold text-[#14243A] leading-snug">
                        {asm.title}
                      </div>
                      <span className="text-xs font-mono font-bold tabular-nums text-[#147D78] shrink-0">
                        {asm.overallPercentage.toFixed(1)}%
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-[11px] text-[#536174] mt-2">
                      <span>{asm.date}</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono tabular-nums">{asm.totalAchieved}/{asm.totalMax} marks</span>
                      <span aria-hidden="true">·</span>
                      <span className="text-[#147D78] font-semibold">Grade {asm.overallGradeLetter || 'B'}</span>
                    </div>

                    {asm.studentReflection && (
                      <div className="mt-2 text-[10px] text-[#147D78] font-medium flex items-center gap-1">
                        <Check className="w-3 h-3" /> Acknowledged by you
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active Assessment Detailed View */}
          {activeAssessment && (
            <div className="lg:col-span-8 space-y-6">
              <div className="bg-white rounded-2xl border border-[#E3E8EF] p-6 sm:p-8 shadow-xs space-y-6">
                {/* Header & Print Action */}
                <div className="flex flex-wrap items-start justify-between gap-4 pb-6 border-b border-[#E3E8EF]">
                  <div>
                    <div className="text-[11px] font-bold text-[#147D78] uppercase tracking-wider mb-1">
                      {activeAssessment.subject || 'Academic Assessment'}
                    </div>
                    <h2 className="text-xl font-bold text-[#14243A]">
                      {activeAssessment.title}
                    </h2>
                    <div className="flex items-center gap-2 text-xs text-[#536174] mt-1">
                      <span>Evaluated on {activeAssessment.date}</span>
                      <span aria-hidden="true">·</span>
                      <span>Instructor: {activeAssessment.teacherName}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => onOpenPrintSlip(activeAssessment)}
                      className="px-3 py-1.5 text-xs font-semibold text-[#14243A] bg-white border border-[#E3E8EF] hover:bg-[#F7F8FA] rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <Printer className="w-3.5 h-3.5 text-[#536174]" />
                      Print / Save Report
                    </button>

                    <div className="text-right pl-3 border-l border-[#E3E8EF]">
                      <div className="text-xs text-[#536174]">Overall Score</div>
                      <div className="text-2xl font-bold font-mono tabular-nums text-[#14243A]">
                        {activeAssessment.overallPercentage.toFixed(1)}%
                      </div>
                      <div className="text-xs font-mono tabular-nums text-[#536174]">
                        {activeAssessment.totalAchieved} / {activeAssessment.totalMax} marks (Grade {activeAssessment.overallGradeLetter || 'B'})
                      </div>
                    </div>
                  </div>
                </div>

                {/* Topic Breakdown */}
                <div>
                  <h3 className="text-xs font-bold text-[#14243A] uppercase tracking-wider mb-3">
                    Topic Breakdown & Performance
                  </h3>

                  <div className="space-y-3">
                    {activeAssessment.topics.map((topic) => (
                      <div key={topic.id} className="bg-[#F7F8FA] p-3.5 rounded-xl border border-[#E3E8EF]">
                        <div className="flex items-center justify-between text-xs mb-1.5">
                          <span className="font-semibold text-[#14243A]">{topic.name}</span>
                          <span className="font-mono tabular-nums font-bold text-[#14243A]">
                            {topic.marksAchieved} / {topic.marksMax}{' '}
                            <span className="text-[#536174] font-normal">
                              ({topic.percentage.toFixed(0)}% · Grade {topic.gradeLetter || (topic.percentage >= 80 ? 'A' : 'B')})
                            </span>
                          </span>
                        </div>

                        {/* Progress Bar */}
                        <div className="w-full bg-[#E3E8EF] h-2 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${
                              topic.percentage >= 80
                                ? 'bg-[#147D78]'
                                : topic.percentage >= 65
                                ? 'bg-slate-600'
                                : 'bg-amber-600'
                            }`}
                            style={{ width: `${Math.min(100, Math.max(5, topic.percentage))}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Three Personalized Guidance Sections */}
                {activeAssessment.feedback && (
                  <div className="space-y-4 pt-4 border-t border-[#E3E8EF]">
                    <h3 className="text-xs font-bold text-[#14243A] uppercase tracking-wider">
                      Personalized Guidance From Your Instructor
                    </h3>

                    {/* Section 1: Strengths */}
                    <div className="p-4 rounded-xl bg-white border border-[#E3E8EF]">
                      <div className="flex items-center gap-2 mb-2 text-xs font-bold text-[#147D78]">
                        <CheckCircle2 className="w-4 h-4 text-[#147D78]" />
                        What You Did Well (Specific Mastery)
                      </div>
                      <p className="text-xs text-[#14243A] leading-relaxed">
                        {activeAssessment.feedback.strengths}
                      </p>
                    </div>

                    {/* Section 2: Areas for Growth */}
                    <div className="p-4 rounded-xl bg-white border border-[#E3E8EF]">
                      <div className="flex items-center gap-2 mb-2 text-xs font-bold text-amber-700">
                        <AlertCircle className="w-4 h-4 text-amber-600" />
                        Areas to Focus On (Conceptual Consolidation)
                      </div>
                      <p className="text-xs text-[#14243A] leading-relaxed">
                        {activeAssessment.feedback.growthAreas}
                      </p>
                    </div>

                    {/* Section 3: Next Steps */}
                    <div className="p-4 rounded-xl bg-[#E6F4EE]/60 border border-[#147D78]/20">
                      <div className="flex items-center gap-2 mb-2 text-xs font-bold text-[#147D78]">
                        <ArrowRight className="w-4 h-4 text-[#147D78]" />
                        Practical Next Step for You
                      </div>
                      <p className="text-xs text-[#14243A] leading-relaxed font-semibold">
                        {activeAssessment.feedback.nextSteps}
                      </p>
                    </div>

                    {/* Student Acknowledgment Box */}
                    <div className="pt-2">
                      {activeAssessment.studentReflection ? (
                        <div className="p-3.5 rounded-xl bg-[#F7F8FA] border border-[#E3E8EF] flex items-start gap-2 text-xs">
                          <CheckCircle2 className="w-4 h-4 text-[#147D78] shrink-0 mt-0.5" />
                          <div>
                            <div className="font-bold text-[#14243A]">Feedback Acknowledged by You</div>
                            {activeAssessment.studentReflection.reflectionNote && (
                              <p className="text-xs text-[#536174] italic mt-0.5">
                                "{activeAssessment.studentReflection.reflectionNote}"
                              </p>
                            )}
                            <div className="text-[10px] text-[#536174] mt-1 font-mono">
                              Recorded on {new Date(activeAssessment.studentReflection.acknowledgedAt).toLocaleString()}
                            </div>
                          </div>
                        </div>
                      ) : showAckInput ? (
                        <div className="p-4 rounded-xl bg-[#F7F8FA] border border-[#E3E8EF] space-y-3">
                          <div className="text-xs font-bold text-[#14243A]">
                            Acknowledge Feedback & Plan Your Next Action
                          </div>
                          <textarea
                            rows={2}
                            value={reflectionInput}
                            onChange={(e) => setReflectionInput(e.target.value)}
                            placeholder="Optional: What is one specific thing you will do to review before the next class?"
                            className="w-full px-3 py-2 text-xs border border-[#E3E8EF] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#147D78] text-[#14243A] bg-white resize-none"
                          />
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => setShowAckInput(false)}
                              className="px-3 py-1.5 text-xs text-[#536174] hover:text-[#14243A] cursor-pointer"
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              disabled={isSubmittingAck}
                              onClick={handleAcknowledge}
                              className="px-3.5 py-1.5 text-xs font-semibold text-white bg-[#147D78] hover:bg-[#0f605c] rounded-lg transition-colors cursor-pointer shadow-xs disabled:opacity-50"
                            >
                              {isSubmittingAck ? 'Saving...' : 'Confirm Acknowledgment'}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between p-3 rounded-xl bg-[#F7F8FA] border border-[#E3E8EF]">
                          <div className="text-xs text-[#536174]">
                            Have you read and understood your feedback?
                          </div>
                          <button
                            type="button"
                            onClick={() => setShowAckInput(true)}
                            className="px-3 py-1.5 text-xs font-semibold text-[#147D78] hover:bg-[#E6F4EE] rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                          >
                            <Check className="w-3.5 h-3.5" />
                            Acknowledge Feedback
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="text-[11px] text-[#536174] pt-2 flex items-center justify-between">
                      <span>Evaluated by {activeAssessment.teacherName}</span>
                      <span className="flex items-center gap-1 font-mono tabular-nums">
                        <Clock className="w-3 h-3" />
                        {activeAssessment.publishedAt ? new Date(activeAssessment.publishedAt).toLocaleDateString() : activeAssessment.date}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
