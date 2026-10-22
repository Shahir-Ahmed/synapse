import React from 'react';
import { CheckCircle2, AlertCircle, ArrowRight, ShieldCheck, Scale, Cpu, Sparkles } from 'lucide-react';
import { SynapseLogo } from './SynapseLogo';

interface GuidelinesViewProps {
  role: 'teacher' | 'student';
}

export const GuidelinesView: React.FC<GuidelinesViewProps> = ({ role }) => {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-xs font-bold text-[#147D78] uppercase tracking-wider mb-1">
            {role === 'teacher' ? 'ClearFeedback Assessment Framework' : 'Understanding Your Feedback'}
          </div>
          <h1 className="text-2xl font-bold text-[#14243A]">
            {role === 'teacher'
              ? 'The ClearFeedback Pedagogical Intelligence Standard'
              : 'How to Read Your ClearFeedback Assessment Record'}
          </h1>
          <p className="text-xs text-[#536174] mt-1">
            {role === 'teacher'
              ? 'A disciplined standard for turning topic scores into respectful, evidence-based, actionable guidance.'
              : 'ClearFeedback is designed to help you celebrate your genuine strengths and take clear, bite-sized steps forward.'}
          </p>
        </div>

        <SynapseLogo size={36} showWordmark={false} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-5 rounded-2xl border border-[#E3E8EF] shadow-xs space-y-3">
          <div className="w-8 h-8 rounded-lg bg-[#E6F4EE] text-[#147D78] flex items-center justify-center">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <h2 className="text-sm font-bold text-[#14243A]">1. Evidence-Grounded Strengths</h2>
          <p className="text-xs text-[#536174] leading-relaxed">
            Every positive recognition is anchored strictly in topic scores where the student met or exceeded expectations. No unverified generic praise.
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#E3E8EF] shadow-xs space-y-3">
          <div className="w-8 h-8 rounded-lg bg-[#FFF3D6] text-amber-700 flex items-center justify-center">
            <AlertCircle className="w-4 h-4" />
          </div>
          <h2 className="text-sm font-bold text-[#14243A]">2. Constructive Growth Areas</h2>
          <p className="text-xs text-[#536174] leading-relaxed">
            Identifies specific syllabus topics where marks indicated gaps. Labeling words like 'weak' or 'lazy' are strictly prohibited in the engine.
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#E3E8EF] shadow-xs space-y-3">
          <div className="w-8 h-8 rounded-lg bg-[#E6F4EE] text-[#147D78] flex items-center justify-center">
            <ArrowRight className="w-4 h-4" />
          </div>
          <h2 className="text-sm font-bold text-[#14243A]">3. One Actionable Next Step</h2>
          <p className="text-xs text-[#536174] leading-relaxed">
            Students are given a tangible, achievable exercise (e.g. reviewing specific diagrams, verifying signs before graphing) rather than overwhelming checklists.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-[#E3E8EF] p-6 shadow-xs space-y-4">
        <h2 className="text-sm font-bold text-[#14243A] flex items-center gap-2">
          <Scale className="w-4 h-4 text-[#147D78]" />
          Our Pedagogical & Privacy Principles
        </h2>

        <div className="space-y-3 text-xs text-[#536174] leading-relaxed">
          <div className="flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 text-[#147D78] shrink-0 mt-0.5" />
            <div>
              <strong className="text-[#14243A]">Strict Privacy & Role Separation:</strong> Students only ever see their own published feedback. Drafts remain hidden until the educator explicitly reviews and authorizes them.
            </div>
          </div>

          <div className="flex items-start gap-2">
            <Cpu className="w-4 h-4 text-[#147D78] shrink-0 mt-0.5" />
            <div>
              <strong className="text-[#14243A]">Deterministic Scoring:</strong> All totals, percentages, grade letter tiers, and validation checks are computed deterministically in standard code, never guessed by language models.
            </div>
          </div>

          <div className="flex items-start gap-2">
            <Sparkles className="w-4 h-4 text-[#147D78] shrink-0 mt-0.5" />
            <div>
              <strong className="text-[#14243A]">Teacher Authority:</strong> The AI drafts commentary for the educator to inspect, modify, and authorize. AI is never permitted to publish feedback without human sign-off.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
