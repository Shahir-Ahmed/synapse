import React from 'react';
import type { Assessment } from '../types/index';
import { SynapseLogo } from './SynapseLogo';
import { Printer, X } from 'lucide-react';

interface PrintFeedbackSlipProps {
  assessment: Assessment;
  onClose: () => void;
}

export const PrintFeedbackSlip: React.FC<PrintFeedbackSlipProps> = ({
  assessment,
  onClose,
}) => {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto print:p-0 print:bg-white print:static print:inset-auto">
      {/* Outer Modal Container (hidden in print, styled as page on screen) */}
      <div className="bg-white rounded-2xl max-w-3xl w-full border border-[#E3E8EF] shadow-2xl overflow-hidden my-8 print:border-none print:shadow-none print:max-w-none print:rounded-none print:m-0">
        {/* Screen Controls Header (hidden during print) */}
        <div className="px-6 py-4 bg-[#14243A] text-white flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2">
            <SynapseLogo size={24} monochrome showWordmark wordmarkClassName="text-white font-bold text-sm tracking-tight" />
            <span className="text-slate-400">·</span>
            <span className="text-xs text-slate-300">Official Student Assessment Report</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="px-3.5 py-1.5 bg-[#147D78] hover:bg-[#0f605c] text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
            >
              <Printer className="w-3.5 h-3.5" />
              Print / Save as PDF
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Official Academic Document Surface */}
        <div className="p-8 sm:p-12 space-y-6 text-[#14243A] print:p-8">
          {/* Institutional Header */}
          <div className="flex items-start justify-between border-b-2 border-[#14243A] pb-6">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <SynapseLogo size={32} showWordmark wordmarkClassName="text-xl font-bold tracking-tight text-[#14243A]" />
              </div>
              <div className="text-xs font-semibold text-[#536174] uppercase tracking-wider">
                Westfield STEM Academy · Department of Academic Assessment
              </div>
              <div className="text-[11px] text-[#536174]">
                Official Individual Assessment & Diagnostic Feedback Record
              </div>
            </div>

            <div className="text-right">
              <div className="text-xs font-mono font-semibold text-[#536174]">
                REF: {assessment.id.toUpperCase()}
              </div>
              <div className="text-xs text-[#536174] mt-1">
                Issued: {assessment.publishedAt ? new Date(assessment.publishedAt).toLocaleDateString() : assessment.date}
              </div>
              <div className="mt-2 inline-block px-2.5 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider bg-[#E6F4EE] text-[#147D78]">
                {assessment.status === 'published' ? 'Verified & Published' : 'Preliminary Draft'}
              </div>
            </div>
          </div>

          {/* Student & Assessment Information Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-[#F7F8FA] border border-[#E3E8EF] text-xs">
            <div>
              <div className="text-[11px] font-semibold text-[#536174] uppercase">Student Name</div>
              <div className="font-bold text-[#14243A] text-sm mt-0.5">{assessment.studentName}</div>
            </div>
            <div>
              <div className="text-[11px] font-semibold text-[#536174] uppercase">Student ID</div>
              <div className="font-mono font-bold text-[#14243A] text-sm mt-0.5">{assessment.studentId}</div>
            </div>
            <div>
              <div className="text-[11px] font-semibold text-[#536174] uppercase">Subject / Course</div>
              <div className="font-bold text-[#14243A] text-sm mt-0.5">{assessment.subject || 'General'}</div>
            </div>
            <div>
              <div className="text-[11px] font-semibold text-[#536174] uppercase">Evaluating Faculty</div>
              <div className="font-bold text-[#14243A] text-sm mt-0.5">{assessment.teacherName}</div>
            </div>
          </div>

          {/* Assessment Title Banner */}
          <div className="flex items-baseline justify-between border-b border-[#E3E8EF] pb-3">
            <div>
              <div className="text-[11px] font-semibold text-[#147D78] uppercase tracking-wider">Assessment Title</div>
              <h2 className="text-base font-bold text-[#14243A]">{assessment.title}</h2>
            </div>
            <div className="text-right">
              <span className="text-xs text-[#536174]">Cumulative Score: </span>
              <span className="text-base font-mono font-bold text-[#14243A]">
                {assessment.totalAchieved} / {assessment.totalMax}
              </span>
              <span className="text-base font-bold text-[#147D78] ml-1">
                ({assessment.overallPercentage.toFixed(1)}% · Grade {assessment.overallGradeLetter || 'B'})
              </span>
            </div>
          </div>

          {/* Topic-Level Evidence Matrix */}
          <div>
            <h3 className="text-xs font-bold text-[#14243A] uppercase tracking-wider mb-2">
              Topic-Level Performance Matrix
            </h3>
            <table className="w-full border-collapse border border-[#E3E8EF] text-xs">
              <thead>
                <tr className="bg-[#F7F8FA] text-[#536174] border-b border-[#E3E8EF]">
                  <th className="py-2 px-3 text-left font-semibold">Evaluation Topic</th>
                  <th className="py-2 px-3 text-center font-semibold">Achieved</th>
                  <th className="py-2 px-3 text-center font-semibold">Maximum</th>
                  <th className="py-2 px-3 text-center font-semibold">Percentage</th>
                  <th className="py-2 px-3 text-center font-semibold">Grade</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E3E8EF]">
                {assessment.topics.map((t) => (
                  <tr key={t.id}>
                    <td className="py-2.5 px-3 font-semibold text-[#14243A]">{t.name}</td>
                    <td className="py-2.5 px-3 text-center font-mono tabular-nums">{t.marksAchieved}</td>
                    <td className="py-2.5 px-3 text-center font-mono tabular-nums">{t.marksMax}</td>
                    <td className="py-2.5 px-3 text-center font-mono tabular-nums font-bold text-[#14243A]">
                      {t.percentage.toFixed(1)}%
                    </td>
                    <td className="py-2.5 px-3 text-center font-mono font-bold text-[#147D78]">
                      {t.gradeLetter || (t.percentage >= 80 ? 'A' : t.percentage >= 65 ? 'B' : 'C')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Three Pedagogical Commentary Sections */}
          {assessment.feedback && (
            <div className="space-y-4 pt-2">
              <h3 className="text-xs font-bold text-[#14243A] uppercase tracking-wider">
                Evidence-Based Feedback & Academic Next Steps
              </h3>

              <div className="p-3.5 rounded-lg border border-[#E3E8EF] bg-white space-y-1">
                <div className="text-[11px] font-bold text-[#147D78] uppercase">
                  1. Specific Evidenced Strengths
                </div>
                <p className="text-xs text-[#14243A] leading-relaxed">
                  {assessment.feedback.strengths}
                </p>
              </div>

              <div className="p-3.5 rounded-lg border border-[#E3E8EF] bg-white space-y-1">
                <div className="text-[11px] font-bold text-amber-800 uppercase">
                  2. Priority Areas for Growth & Consolidation
                </div>
                <p className="text-xs text-[#14243A] leading-relaxed">
                  {assessment.feedback.growthAreas}
                </p>
              </div>

              <div className="p-3.5 rounded-lg border border-[#147D78]/30 bg-[#E6F4EE]/40 space-y-1">
                <div className="text-[11px] font-bold text-[#147D78] uppercase">
                  3. Actionable Next Step
                </div>
                <p className="text-xs text-[#14243A] leading-relaxed font-medium">
                  {assessment.feedback.nextSteps}
                </p>
              </div>
            </div>
          )}

          {/* Student Reflection Note (if present) */}
          {assessment.studentReflection && (
            <div className="p-3 rounded-lg bg-[#F7F8FA] border border-[#E3E8EF] text-xs">
              <div className="text-[11px] font-bold text-[#536174] uppercase">
                Student Acknowledgment & Study Action
              </div>
              <p className="text-[#14243A] italic mt-0.5">
                "{assessment.studentReflection.reflectionNote || 'Acknowledged and reviewed.'}"
              </p>
              <div className="text-[10px] text-[#536174] mt-1 font-mono">
                Signed electronically on {new Date(assessment.studentReflection.acknowledgedAt).toLocaleString()}
              </div>
            </div>
          )}

          {/* Signatures & Accreditation Footer */}
          <div className="pt-8 grid grid-cols-2 gap-8 border-t border-[#E3E8EF] text-xs">
            <div>
              <div className="h-10 border-b border-dashed border-[#536174] mb-1"></div>
              <div className="font-semibold text-[#14243A]">{assessment.teacherName}</div>
              <div className="text-[11px] text-[#536174]">Instructor Signature & Date</div>
            </div>
            <div>
              <div className="h-10 border-b border-dashed border-[#536174] mb-1"></div>
              <div className="font-semibold text-[#14243A]">{assessment.studentName}</div>
              <div className="text-[11px] text-[#536174]">Student Signature & Date</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
