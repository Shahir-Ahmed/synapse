import React, { useState } from 'react';
import type { Assessment, FeedbackContent, GenerateFeedbackRequest } from '../types/index';
import { api } from '../services/apiClient';
import { X, Send, Sparkles, CheckCircle2, AlertCircle, Printer, Sliders } from 'lucide-react';

interface FeedbackReviewModalProps {
  assessment: Assessment;
  onClose: () => void;
  onSaved: (updated: Assessment) => void;
  onOpenPrintSlip?: (assessment: Assessment) => void;
}

export const FeedbackReviewModal: React.FC<FeedbackReviewModalProps> = ({
  assessment,
  onClose,
  onSaved,
  onOpenPrintSlip,
}) => {
  const [strengths, setStrengths] = useState(assessment.feedback?.strengths || '');
  const [growthAreas, setGrowthAreas] = useState(assessment.feedback?.growthAreas || '');
  const [nextSteps, setNextSteps] = useState(assessment.feedback?.nextSteps || '');
  const [teacherNotes, setTeacherNotes] = useState(assessment.teacherNotes || '');
  const [selectedTone, setSelectedTone] = useState<'encouraging' | 'rigorous' | 'foundational'>(
    assessment.feedback?.tone || 'encouraging'
  );
  const [isSaving, setIsSaving] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [feedbackOrigin, setFeedbackOrigin] = useState<'gemini' | 'rule_engine'>(
    assessment.feedback?.generatedBy || 'gemini'
  );

  const handleRegenerate = async () => {
    setIsRegenerating(true);
    setError(null);

    const payload: GenerateFeedbackRequest = {
      assessmentTitle: assessment.title,
      studentName: assessment.studentName,
      topics: assessment.topics.map((t) => ({
        name: t.name,
        marksAchieved: t.marksAchieved,
        marksMax: t.marksMax,
        percentage: t.percentage,
      })),
      overallPercentage: assessment.overallPercentage,
      teacherNotes: teacherNotes.trim() || undefined,
      tone: selectedTone,
    };

    try {
      const regenerated = await api.generateFeedback(payload);
      setStrengths(regenerated.strengths);
      setGrowthAreas(regenerated.growthAreas);
      setNextSteps(regenerated.nextSteps);
      setFeedbackOrigin(regenerated.generatedBy);
    } catch (err: any) {
      setError(err.message || 'Regeneration failed. Please try again.');
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleSave = async (publish: boolean) => {
    if (!strengths.trim() || !growthAreas.trim() || !nextSteps.trim()) {
      setError('All three feedback sections (Strengths, Areas for Growth, and Next Steps) are required.');
      return;
    }

    setIsSaving(true);
    setError(null);

    const updatedFeedback: FeedbackContent = {
      strengths: strengths.trim(),
      growthAreas: growthAreas.trim(),
      nextSteps: nextSteps.trim(),
      generatedBy: feedbackOrigin,
      generatedAt: assessment.feedback?.generatedAt || new Date().toISOString(),
      lastEditedAt: new Date().toISOString(),
      tone: selectedTone,
    };

    try {
      let saved: Assessment;
      if (publish) {
        await api.updateAssessment(assessment.id, {
          teacherNotes: teacherNotes.trim() || undefined,
          feedback: updatedFeedback,
        });
        saved = await api.publishAssessment(assessment.id);
      } else {
        saved = await api.updateAssessment(assessment.id, {
          teacherNotes: teacherNotes.trim() || undefined,
          feedback: updatedFeedback,
          status: 'draft',
        });
      }

      onSaved(saved);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save assessment feedback.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-3xl w-full border border-[#E3E8EF] shadow-2xl overflow-hidden my-8">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#E3E8EF] flex items-center justify-between bg-white">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-[#14243A]">Review & Personalize Feedback</h2>
              <span className="text-xs text-[#536174]">·</span>
              <span className="text-xs font-semibold text-[#147D78]">
                {assessment.studentName} ({assessment.studentId})
              </span>
            </div>
            <p className="text-xs text-[#536174] mt-0.5">
              Verify accuracy against recorded marks before authorizing publication
            </p>
          </div>

          <div className="flex items-center gap-2">
            {onOpenPrintSlip && assessment.status === 'published' && (
              <button
                type="button"
                onClick={() => onOpenPrintSlip(assessment)}
                className="px-2.5 py-1 text-xs border border-[#E3E8EF] rounded-lg hover:bg-[#F7F8FA] text-[#536174] flex items-center gap-1 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                Print Slip
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-lg text-[#536174] hover:bg-[#F7F8FA] hover:text-[#14243A] cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Assessment Summary & Verified Marks */}
          <div className="bg-[#F7F8FA] border border-[#E3E8EF] rounded-xl p-4">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 mb-3 border-b border-[#E3E8EF]">
              <div>
                <h3 className="text-sm font-bold text-[#14243A]">{assessment.title}</h3>
                <div className="text-xs text-[#536174] mt-0.5">
                  Subject: {assessment.subject || 'General'} · Date: {assessment.date} · Evaluator: {assessment.teacherName}
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs font-semibold text-[#536174]">Overall Score</div>
                <div className="text-base font-bold font-mono tabular-nums text-[#14243A]">
                  {assessment.totalAchieved} / {assessment.totalMax}{' '}
                  <span className="text-sm text-[#147D78]">
                    ({assessment.overallPercentage.toFixed(1)}% · Grade {assessment.overallGradeLetter || 'B'})
                  </span>
                </div>
              </div>
            </div>

            {/* Topic Breakdown Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {assessment.topics.map((t) => (
                <div key={t.id} className="bg-white p-2.5 rounded-lg border border-[#E3E8EF]">
                  <div className="text-[11px] font-medium text-[#536174] truncate" title={t.name}>
                    {t.name}
                  </div>
                  <div className="flex items-baseline justify-between mt-1">
                    <span className="text-xs font-bold font-mono tabular-nums text-[#14243A]">
                      {t.marksAchieved}/{t.marksMax}
                    </span>
                    <span className="text-xs font-semibold font-mono tabular-nums text-[#147D78]">
                      {t.percentage.toFixed(0)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* AI Intelligence Controls & Provenance Banner */}
          <div className="p-3.5 rounded-xl bg-[#E6F4EE]/70 border border-[#147D78]/20 text-[#14243A] space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-xs">
                <Sparkles className="w-4 h-4 text-[#147D78]" />
                <span className="font-semibold">
                  {feedbackOrigin === 'gemini'
                    ? 'Generated by ClearFeedback AI (Gemini 3.8 Flash)'
                    : 'Generated via Deterministic Academic Rule Engine'}
                </span>
              </div>

              <button
                type="button"
                disabled={isRegenerating}
                onClick={handleRegenerate}
                className="text-xs font-semibold text-[#147D78] hover:underline cursor-pointer disabled:opacity-50"
              >
                {isRegenerating ? 'Regenerating...' : 'Regenerate Draft with Options'}
              </button>
            </div>

            {/* Tone Selector */}
            <div className="flex items-center gap-2 pt-1 border-t border-[#147D78]/10 text-xs">
              <Sliders className="w-3.5 h-3.5 text-[#536174]" />
              <span className="text-[#536174] font-medium">Pedagogical Tone:</span>
              <div className="flex gap-1.5">
                {(['encouraging', 'rigorous', 'foundational'] as const).map((tone) => (
                  <button
                    key={tone}
                    type="button"
                    onClick={() => setSelectedTone(tone)}
                    className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors cursor-pointer ${
                      selectedTone === tone
                        ? 'bg-[#147D78] text-white shadow-xs'
                        : 'bg-white text-[#536174] hover:text-[#14243A]'
                    }`}
                  >
                    {tone === 'encouraging' ? 'Encouraging' : tone === 'rigorous' ? 'Rigorous' : 'Foundational'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 3 Editable Feedback Sections */}
          <div className="space-y-4">
            {/* Section 1: Strengths */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-[#14243A] flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#147D78]" />
                  1. Specific Strengths (Supported by Score Evidence)
                </label>
                <span className="text-[11px] text-[#536174]">Anchor in highest scores</span>
              </div>
              <textarea
                rows={3}
                value={strengths}
                onChange={(e) => setStrengths(e.target.value)}
                placeholder="Highlight specific topics where the student showed mastery..."
                className="w-full px-3 py-2 text-xs border border-[#E3E8EF] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#147D78] text-[#14243A] bg-white resize-y"
              />
            </div>

            {/* Section 2: Areas for Growth */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-[#14243A] flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                  2. Priority Areas for Growth (Constructive & Factual)
                </label>
                <span className="text-[11px] text-[#536174]">Objectively address gaps</span>
              </div>
              <textarea
                rows={3}
                value={growthAreas}
                onChange={(e) => setGrowthAreas(e.target.value)}
                placeholder="Identify 1-2 syllabus topics requiring consolidation..."
                className="w-full px-3 py-2 text-xs border border-[#E3E8EF] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#147D78] text-[#14243A] bg-white resize-y"
              />
            </div>

            {/* Section 3: Next Steps */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-[#14243A] flex items-center gap-1.5">
                  <Send className="w-3.5 h-3.5 text-[#147D78]" />
                  3. Practical Next Step (Actionable Recommendation)
                </label>
                <span className="text-[11px] text-[#536174]">Bite-sized study task</span>
              </div>
              <textarea
                rows={3}
                value={nextSteps}
                onChange={(e) => setNextSteps(e.target.value)}
                placeholder="Give a practical recommendation directly tied to those growth areas..."
                className="w-full px-3 py-2 text-xs border border-[#E3E8EF] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#147D78] text-[#14243A] bg-white resize-y"
              />
            </div>

            {/* Optional Teacher Context Notes */}
            <div>
              <label className="block text-xs font-semibold text-[#14243A] mb-1">
                Teacher's Private Observational Notes
              </label>
              <textarea
                rows={2}
                value={teacherNotes}
                onChange={(e) => setTeacherNotes(e.target.value)}
                placeholder="Private context for your records..."
                className="w-full px-3 py-2 text-xs border border-[#E3E8EF] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#147D78] text-[#14243A] bg-white resize-none"
              />
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
              <div>{error}</div>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="px-6 py-4 bg-[#F7F8FA] border-t border-[#E3E8EF] flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-[#536174]">
            Status:{' '}
            <span
              className={`font-semibold ${
                assessment.status === 'published' ? 'text-[#147D78]' : 'text-amber-700'
              }`}
            >
              {assessment.status === 'published' ? 'Published' : 'Draft (Unpublished)'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-[#536174] hover:text-[#14243A] hover:bg-white rounded-lg transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={isSaving}
              onClick={() => handleSave(false)}
              className="px-4 py-2 text-xs font-semibold text-[#14243A] bg-white border border-[#E3E8EF] hover:bg-slate-50 rounded-lg shadow-xs transition-colors cursor-pointer disabled:opacity-50"
            >
              Save as Draft
            </button>
            <button
              type="button"
              disabled={isSaving}
              onClick={() => handleSave(true)}
              className="px-4 py-2 text-xs font-semibold text-white bg-[#147D78] hover:bg-[#0f605c] rounded-lg shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              Publish to Student Portal
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
