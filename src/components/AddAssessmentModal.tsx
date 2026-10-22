import React, { useState } from 'react';
import type { Student, AssessmentTopic, FeedbackContent, GenerateFeedbackRequest } from '../types/index';
import { api } from '../services/apiClient';
import { X, Plus, Trash2, Sparkles, AlertCircle, Sliders } from 'lucide-react';

interface AddAssessmentModalProps {
  students: Student[];
  initialStudentId?: string;
  onClose: () => void;
  onAssessmentPrepared: (data: {
    studentId: string;
    studentName: string;
    title: string;
    subject?: string;
    date: string;
    topics: AssessmentTopic[];
    totalAchieved: number;
    totalMax: number;
    overallPercentage: number;
    teacherNotes?: string;
    feedback?: FeedbackContent;
  }) => void;
  onOpenAddStudent: () => void;
}

const getLocalDateInputValue = () => {
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60_000).toISOString().slice(0, 10);
};

const PRESET_TEMPLATES = [
  {
    name: 'Cell Biology (Grade 9)',
    title: 'Unit 2: Molecular & Cellular Biology',
    subject: 'Biology',
    topics: [
      { name: 'Cellular Respiration', marksAchieved: 18, marksMax: 20 },
      { name: 'Enzyme Kinetics', marksAchieved: 16, marksMax: 20 },
      { name: 'Photosynthesis Stages', marksAchieved: 15, marksMax: 20 },
      { name: 'Membrane Transport & Osmosis', marksAchieved: 12, marksMax: 20 },
    ],
    teacherNotes: 'Solid understanding of ATP synthesis; needs practice distinguishing passive diffusion from active transport.',
  },
  {
    name: 'Algebra Functions (Grade 10)',
    title: 'Midterm Examination: Linear Functions & Graphs',
    subject: 'Mathematics',
    topics: [
      { name: 'Quadratic Factoring', marksAchieved: 19, marksMax: 20 },
      { name: 'System of Equations', marksAchieved: 15, marksMax: 20 },
      { name: 'Word Problem Translation', marksAchieved: 13, marksMax: 20 },
      { name: 'Coordinate Slope & Intercepts', marksAchieved: 10, marksMax: 20 },
    ],
    teacherNotes: 'Strong algebraic manipulation; struggles with negative slope graphs.',
  },
  {
    name: 'Analytical Essay (Literature)',
    title: 'Essay Rubric: Comparative Literary Analysis',
    subject: 'English',
    topics: [
      { name: 'Thesis Clarity & Argument', marksAchieved: 22, marksMax: 25 },
      { name: 'Textual Evidence & Citation', marksAchieved: 23, marksMax: 25 },
      { name: 'Critical Analysis & Depth', marksAchieved: 18, marksMax: 25 },
      { name: 'Grammar, Style & Transitions', marksAchieved: 20, marksMax: 25 },
    ],
    teacherNotes: 'Excellent quotations selected; elaboration in body paragraph 3 was somewhat abrupt.',
  },
];

export const AddAssessmentModal: React.FC<AddAssessmentModalProps> = ({
  students,
  initialStudentId,
  onClose,
  onAssessmentPrepared,
  onOpenAddStudent,
}) => {
  const [selectedStudentId, setSelectedStudentId] = useState<string>(
    initialStudentId || (students.length > 0 ? students[0].studentId : '')
  );
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('Biology');
  const [date, setDate] = useState(getLocalDateInputValue());
  const [teacherNotes, setTeacherNotes] = useState('');
  const [selectedTone, setSelectedTone] = useState<'encouraging' | 'rigorous' | 'foundational'>('encouraging');
  const [topics, setTopics] = useState<AssessmentTopic[]>([
    { id: '1', name: 'Core Concepts', marksAchieved: 16, marksMax: 20, percentage: 80.0 },
    { id: '2', name: 'Problem Solving', marksAchieved: 14, marksMax: 20, percentage: 70.0 },
  ]);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleTopicChange = (
    index: number,
    field: 'name' | 'marksAchieved' | 'marksMax',
    value: string
  ) => {
    setValidationError(null);
    setTopics((prev) => {
      const copy = [...prev];
      const target = { ...copy[index] };

      if (field === 'name') {
        target.name = value;
      } else if (field === 'marksAchieved') {
        const num = parseFloat(value) || 0;
        target.marksAchieved = num;
      } else if (field === 'marksMax') {
        const num = parseFloat(value) || 0;
        target.marksMax = num;
      }

      const max = target.marksMax > 0 ? target.marksMax : 1;
      target.percentage = Number(((target.marksAchieved / max) * 100).toFixed(1));
      copy[index] = target;
      return copy;
    });
  };

  const handleAddTopic = () => {
    setTopics((prev) => [
      ...prev,
      {
        id: `topic-${Date.now()}`,
        name: '',
        marksAchieved: 0,
        marksMax: 20,
        percentage: 0,
      },
    ]);
  };

  const handleRemoveTopic = (index: number) => {
    if (topics.length <= 1) {
      setValidationError('At least one topic is required for an assessment.');
      return;
    }
    setTopics((prev) => prev.filter((_, i) => i !== index));
  };

  const handleApplyPreset = (presetIndex: number) => {
    const preset = PRESET_TEMPLATES[presetIndex];
    if (!preset) return;
    setTitle(preset.title);
    setSubject(preset.subject);
    setTeacherNotes(preset.teacherNotes);
    setTopics(
      preset.topics.map((t, idx) => ({
        id: `preset-${idx}`,
        name: t.name,
        marksAchieved: t.marksAchieved,
        marksMax: t.marksMax,
        percentage: Number(((t.marksAchieved / t.marksMax) * 100).toFixed(1)),
      }))
    );
    setValidationError(null);
  };

  const totalAchieved = topics.reduce((acc, t) => acc + (Number(t.marksAchieved) || 0), 0);
  const totalMax = topics.reduce((acc, t) => acc + (Number(t.marksMax) || 0), 0);
  const overallPercentage =
    totalMax > 0 ? Number(((totalAchieved / totalMax) * 100).toFixed(1)) : 0;

  const validateForm = (): boolean => {
    if (!selectedStudentId) {
      setValidationError('Please select a student for this assessment.');
      return false;
    }
    if (!title.trim()) {
      setValidationError('Please enter an assessment title.');
      return false;
    }
    if (topics.length === 0) {
      setValidationError('Please provide at least one topic.');
      return false;
    }
    if (!date || Number.isNaN(new Date(`${date}T00:00:00`).getTime())) {
      setValidationError('Please choose a valid assessment date.');
      return false;
    }

    for (let i = 0; i < topics.length; i++) {
      const t = topics[i];
      if (!t.name.trim()) {
        setValidationError(`Topic #${i + 1} needs a name.`);
        return false;
      }
      if (!Number.isFinite(t.marksMax) || t.marksMax <= 0) {
        setValidationError(`Topic "${t.name}" maximum marks must be greater than 0.`);
        return false;
      }
      if (!Number.isFinite(t.marksAchieved) || t.marksAchieved < 0) {
        setValidationError(`Topic "${t.name}" achieved marks cannot be negative.`);
        return false;
      }
      if (t.marksAchieved > t.marksMax) {
        setValidationError(
          `Topic "${t.name}" achieved marks (${t.marksAchieved}) cannot exceed maximum marks (${t.marksMax}).`
        );
        return false;
      }
    }

    setValidationError(null);
    return true;
  };

  const handleGenerateFeedback = async () => {
    if (!validateForm()) return;

    const student = students.find((s) => s.studentId === selectedStudentId);
    if (!student) {
      setValidationError('Selected student not found.');
      return;
    }

    setIsGenerating(true);
    setValidationError(null);

    const payload: GenerateFeedbackRequest = {
      assessmentTitle: title.trim(),
      studentName: student.name,
      topics: topics.map((t) => ({
        name: t.name.trim(),
        marksAchieved: t.marksAchieved,
        marksMax: t.marksMax,
        percentage: t.percentage,
      })),
      overallPercentage,
      teacherNotes: teacherNotes.trim() || undefined,
      tone: selectedTone,
    };

    try {
      const feedback = await api.generateFeedback(payload);
      onAssessmentPrepared({
        studentId: student.studentId,
        studentName: student.name,
        title: title.trim(),
        subject,
        date,
        topics,
        totalAchieved,
        totalMax,
        overallPercentage,
        teacherNotes: teacherNotes.trim() || undefined,
        feedback,
      });
    } catch (err: any) {
      setValidationError(err.message || 'Feedback generation failed. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-2xl w-full border border-[#E3E8EF] shadow-2xl overflow-hidden my-8">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#E3E8EF] flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-[#14243A]">Enter Assessment Results</h2>
            <p className="text-xs text-[#536174]">
              Input topic-level marks to generate evidence-grounded feedback
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-[#536174] hover:bg-[#F7F8FA] hover:text-[#14243A] cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Preset Template Buttons */}
          <div>
            <div className="text-xs font-semibold text-[#14243A] mb-2">
              Assessment Rubric Presets
            </div>
            <div className="flex flex-wrap gap-2">
              {PRESET_TEMPLATES.map((tmpl, idx) => (
                <button
                  key={tmpl.name}
                  type="button"
                  onClick={() => handleApplyPreset(idx)}
                  className="px-2.5 py-1 text-xs border border-[#E3E8EF] rounded-lg hover:border-[#147D78] hover:bg-[#F7F8FA] text-[#14243A] transition-colors cursor-pointer"
                >
                  {tmpl.name}
                </button>
              ))}
            </div>
          </div>

          {/* Student Selector & Subject */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-[#14243A]">
                  Student
                </label>
                <button
                  type="button"
                  onClick={onOpenAddStudent}
                  className="text-xs font-semibold text-[#147D78] hover:underline cursor-pointer"
                >
                  + Add New Student
                </button>
              </div>
              <select
                value={selectedStudentId}
                onChange={(e) => setSelectedStudentId(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-[#E3E8EF] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#147D78] text-[#14243A] bg-white cursor-pointer"
              >
                {students.map((s) => (
                  <option key={s.studentId} value={s.studentId}>
                    {s.name} ({s.studentId} · {s.gradeLevel})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#14243A] mb-1">
                Subject
              </label>
              <select
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-[#E3E8EF] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#147D78] text-[#14243A] bg-white cursor-pointer"
              >
                <option value="Biology">Biology</option>
                <option value="Mathematics">Mathematics</option>
                <option value="Physics">Physics</option>
                <option value="Chemistry">Chemistry</option>
                <option value="English">English</option>
                <option value="History">History</option>
              </select>
            </div>
          </div>

          {/* Assessment Title & Date */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-[#14243A] mb-1">
                Assessment Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Unit 2: Molecular & Cellular Biology"
                className="w-full px-3 py-2 text-xs border border-[#E3E8EF] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#147D78] text-[#14243A] bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#14243A] mb-1">
                Evaluation Date
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-[#E3E8EF] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#147D78] text-[#14243A] bg-white"
              />
            </div>
          </div>

          {/* Topic-Level Scores Builder */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-[#14243A]">
                Topic-Level Marks
              </label>
              <button
                type="button"
                onClick={handleAddTopic}
                className="text-xs font-semibold text-[#147D78] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Topic Row
              </button>
            </div>

            <div className="border border-[#E3E8EF] rounded-xl overflow-hidden">
              <div className="grid grid-cols-12 gap-2 bg-[#F7F8FA] px-3 py-2 text-[11px] font-semibold text-[#536174] border-b border-[#E3E8EF]">
                <div className="col-span-5 sm:col-span-6">Topic Name</div>
                <div className="col-span-3 sm:col-span-2 text-center">Achieved</div>
                <div className="col-span-3 sm:col-span-2 text-center">Max Marks</div>
                <div className="hidden sm:block sm:col-span-1 text-right">%</div>
                <div className="col-span-1 text-center"></div>
              </div>

              <div className="divide-y divide-[#E3E8EF]">
                {topics.map((topic, index) => {
                  const isInvalid = topic.marksAchieved > topic.marksMax || topic.marksAchieved < 0;
                  return (
                    <div
                      key={topic.id}
                      className={`grid grid-cols-12 gap-2 px-3 py-2 items-center ${
                        isInvalid ? 'bg-red-50/50' : 'bg-white'
                      }`}
                    >
                      <div className="col-span-5 sm:col-span-6">
                        <input
                          type="text"
                          value={topic.name}
                          onChange={(e) => handleTopicChange(index, 'name', e.target.value)}
                          placeholder={`e.g. Topic ${index + 1}`}
                          className="w-full px-2.5 py-1 text-xs border border-[#E3E8EF] rounded-md focus:outline-none focus:ring-1 focus:ring-[#147D78]"
                        />
                      </div>
                      <div className="col-span-3 sm:col-span-2">
                        <input
                          type="number"
                          min="0"
                          max={topic.marksMax}
                          step="0.5"
                          value={topic.marksAchieved}
                          onChange={(e) =>
                            handleTopicChange(index, 'marksAchieved', e.target.value)
                          }
                          className={`w-full px-2 py-1 text-xs text-center font-mono tabular-nums border rounded-md focus:outline-none focus:ring-1 ${
                            isInvalid
                              ? 'border-red-400 text-red-700 bg-red-50'
                              : 'border-[#E3E8EF] text-[#14243A]'
                          }`}
                        />
                      </div>
                      <div className="col-span-3 sm:col-span-2">
                        <input
                          type="number"
                          min="1"
                          step="1"
                          value={topic.marksMax}
                          onChange={(e) => handleTopicChange(index, 'marksMax', e.target.value)}
                          className="w-full px-2 py-1 text-xs text-center font-mono tabular-nums border border-[#E3E8EF] rounded-md focus:outline-none focus:ring-1 focus:ring-[#147D78] text-[#14243A]"
                        />
                      </div>
                      <div className="hidden sm:block sm:col-span-1 text-right text-xs font-mono tabular-nums font-semibold text-[#536174]">
                        {topic.percentage.toFixed(0)}%
                      </div>
                      <div className="col-span-1 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveTopic(index)}
                          title="Remove topic"
                          className="text-[#536174] hover:text-red-600 transition-colors p-1 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Tally Summary Bar */}
              <div className="bg-[#F7F8FA] px-4 py-2.5 border-t border-[#E3E8EF] flex items-center justify-between text-xs">
                <span className="font-semibold text-[#14243A]">Overall Total:</span>
                <div className="font-mono tabular-nums font-bold text-[#14243A] flex items-center gap-2">
                  <span>
                    {totalAchieved} / {totalMax} marks
                  </span>
                  <span className="text-[#536174]">·</span>
                  <span className="text-[#147D78]">{overallPercentage.toFixed(1)}%</span>
                </div>
              </div>
            </div>
          </div>

          {/* AI Pedagogical Tone Selection */}
          <div className="flex items-center gap-3 p-3 bg-[#F7F8FA] rounded-xl border border-[#E3E8EF] text-xs">
            <Sliders className="w-4 h-4 text-[#147D78]" />
            <span className="font-semibold text-[#14243A]">Pedagogical Tone:</span>
            <div className="flex gap-2">
              <label className="flex items-center gap-1 cursor-pointer text-xs">
                <input
                  type="radio"
                  name="tone"
                  value="encouraging"
                  checked={selectedTone === 'encouraging'}
                  onChange={() => setSelectedTone('encouraging')}
                />
                Balanced
              </label>
              <label className="flex items-center gap-1 cursor-pointer text-xs">
                <input
                  type="radio"
                  name="tone"
                  value="rigorous"
                  checked={selectedTone === 'rigorous'}
                  onChange={() => setSelectedTone('rigorous')}
                />
                Rigorous
              </label>
              <label className="flex items-center gap-1 cursor-pointer text-xs">
                <input
                  type="radio"
                  name="tone"
                  value="foundational"
                  checked={selectedTone === 'foundational'}
                  onChange={() => setSelectedTone('foundational')}
                />
                Foundational
              </label>
            </div>
          </div>

          {/* Teacher Observational Notes */}
          <div>
            <label className="block text-xs font-semibold text-[#14243A] mb-1">
              Teacher's Observational Notes (Optional Context)
            </label>
            <textarea
              rows={2}
              value={teacherNotes}
              onChange={(e) => setTeacherNotes(e.target.value)}
              placeholder="e.g. Demonstrated solid grasp of reaction mechanisms; was slightly rushed on membrane transport calculation."
              className="w-full px-3 py-2 text-xs border border-[#E3E8EF] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#147D78] text-[#14243A] bg-white resize-none"
            />
          </div>

          {validationError && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
              <div>{validationError}</div>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="px-6 py-4 bg-[#F7F8FA] border-t border-[#E3E8EF] flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-[#536174] hover:text-[#14243A] hover:bg-white rounded-lg transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={isGenerating}
            onClick={handleGenerateFeedback}
            className="px-4 py-2 text-xs font-semibold text-white bg-[#147D78] hover:bg-[#0f605c] rounded-lg shadow-xs transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <Sparkles className="w-3.5 h-3.5" />
            {isGenerating ? 'Generating Draft...' : 'Generate Feedback Draft'}
          </button>
        </div>
      </div>
    </div>
  );
};
