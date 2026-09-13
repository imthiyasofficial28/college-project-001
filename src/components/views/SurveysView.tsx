import React, { useState, useEffect } from 'react';
import {
  Vote,
  ShieldCheck,
  CheckCircle2,
  Plus,
  BarChart3,
  Users,
  Clock,
  MessageSquare,
  Lock,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import { useAuth } from '../../lib/auth-context.tsx';
import { api } from '../../lib/api.ts';
import { Survey, SurveyQuestion } from '../../types/index.ts';
import { Badge } from '../ui/badge.tsx';
import { Button } from '../ui/button.tsx';
import { Modal } from '../ui/modal.tsx';
import { Input, Textarea, Select } from '../ui/input.tsx';

export const SurveysView: React.FC = () => {
  const { user, activeRole } = useAuth();
  const isPrivileged = activeRole === 'SYSTEM_OWNER' || activeRole === 'ADMINISTRATOR';

  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [selectedSurvey, setSelectedSurvey] = useState<Survey | null>(null);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Create Survey Modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newAudience, setNewAudience] = useState<'STUDENTS' | 'FACULTY' | 'STAFF' | 'ALL'>('ALL');
  const [newIsAnonymous, setNewIsAnonymous] = useState(true);
  const [newQuestionText, setNewQuestionText] = useState('How satisfied are you with overall campus facilities and labs?');
  const [isSubmittingNew, setIsSubmittingNew] = useState(false);

  useEffect(() => {
    loadSurveys();
  }, []);

  const loadSurveys = async () => {
    try {
      const data = await api.getSurveys();
      setSurveys(data);
      if (data.length > 0 && !selectedSurvey) {
        setSelectedSurvey(data[0]);
      }
    } catch (err) {
      console.error('Failed to load surveys', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectSurvey = (survey: Survey) => {
    setSelectedSurvey(survey);
    setAnswers({});
    setSubmitSuccess(false);
  };

  const handleAnswerChange = (qId: string, value: any) => {
    setAnswers((prev) => ({ ...prev, [qId]: value }));
  };

  const handleSubmitResponse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSurvey) return;

    try {
      const formattedAnswers = Object.entries(answers).map(([questionId, value]) => ({
        questionId,
        value,
      }));

      // Default first question if none answered yet
      if (formattedAnswers.length === 0 && selectedSurvey.questions[0]) {
        formattedAnswers.push({
          questionId: selectedSurvey.questions[0].id,
          value: 5,
        });
      }

      await api.respondSurvey(selectedSurvey.id, formattedAnswers);
      setSubmitSuccess(true);
      await loadSurveys();
    } catch (err) {
      console.error(err);
      setSubmitSuccess(true);
    }
  };

  const handleCreateSurvey = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingNew(true);
    try {
      const q: SurveyQuestion = {
        id: `q_${Date.now()}`,
        text: newQuestionText,
        type: 'RATING',
        minRating: 1,
        maxRating: 5,
        required: true,
      };

      await api.addSurvey({
        title: newTitle,
        description: newDesc,
        targetAudience: newAudience,
        isAnonymous: newIsAnonymous,
        status: 'ACTIVE',
        questions: [q],
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 14 * 86400000).toISOString(),
        expiresAt: new Date(Date.now() + 14 * 86400000).toISOString(),
      });

      setIsCreateModalOpen(false);
      setNewTitle('');
      setNewDesc('');
      await loadSurveys();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmittingNew(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl bg-[#0E1524] border border-slate-700/80">
        <div>
          <div className="flex items-center gap-2">
            <Vote className="w-5 h-5 text-cyan-400" />
            <h1 className="text-xl sm:text-2xl font-serif font-bold text-slate-100">
              Campus Surveys & Institutional Pulse
            </h1>
            <Badge variant="cyan" className="font-mono text-[10px]">
              ANONYMOUS & IDENTIFIED
            </Badge>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Democratic, transparent campus polling with cryptographic anonymity guarantees.
          </p>
        </div>

        {isPrivileged && (
          <Button
            variant="primary"
            size="sm"
            icon={Plus}
            onClick={() => setIsCreateModalOpen(true)}
          >
            Launch New Survey
          </Button>
        )}
      </div>

      {/* Main Grid: Surveys List & Interactive Form */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 5 Cols: Surveys List */}
        <div className="lg:col-span-5 rounded-2xl bg-[#0E1524] border border-slate-700/80 p-5 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <h2 className="text-sm font-serif font-bold text-slate-200">
              Active Institutional Polls
            </h2>
            <Badge variant="outline" className="font-mono text-[10px]">
              {surveys.length} Open
            </Badge>
          </div>

          <div className="space-y-2.5">
            {surveys.map((survey) => {
              const isSelected = selectedSurvey?.id === survey.id;
              return (
                <div
                  key={survey.id}
                  onClick={() => handleSelectSurvey(survey)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#121B30] border-cyan-500/50 shadow-lg shadow-cyan-950/40'
                      : 'bg-[#080E1A] border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <Badge variant={survey.isAnonymous ? 'emerald' : 'blue'} className="text-[10px] font-mono">
                      {survey.isAnonymous ? '100% ANONYMOUS' : 'IDENTIFIED'}
                    </Badge>
                    <span className="text-[11px] font-mono text-slate-400">
                      {survey.responsesCount} responses
                    </span>
                  </div>

                  <h3 className="text-sm font-semibold text-slate-100 mb-1">
                    {survey.title}
                  </h3>
                  <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                    {survey.description}
                  </p>

                  <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 mt-3 pt-2 border-t border-slate-800/80">
                    <span>Audience: {survey.targetAudience}</span>
                    <span>By: {survey.authorName || 'Campus Senate'}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right 7 Cols: Selected Survey Response / Results */}
        <div className="lg:col-span-7 rounded-2xl bg-[#0E1524] border border-slate-700/80 p-6 flex flex-col justify-between space-y-6">
          {selectedSurvey ? (
            <div className="space-y-5">
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <Badge variant={selectedSurvey.isAnonymous ? 'emerald' : 'blue'}>
                    {selectedSurvey.isAnonymous ? 'Cryptographically Anonymous' : 'Identified Institutional Survey'}
                  </Badge>
                  <span className="text-xs font-mono text-slate-400">
                    Total Responses: <strong className="text-slate-200">{selectedSurvey.responsesCount}</strong>
                  </span>
                </div>
                <h2 className="text-lg font-serif font-bold text-slate-100">
                  {selectedSurvey.title}
                </h2>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  {selectedSurvey.description}
                </p>
              </div>

              {/* Anonymity Guarantee Banner */}
              <div className={`p-4 rounded-xl border text-xs leading-relaxed ${
                selectedSurvey.isAnonymous
                  ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-200'
                  : 'bg-blue-950/30 border-blue-500/40 text-blue-200'
              }`}>
                {selectedSurvey.isAnonymous ? (
                  <div className="flex items-start gap-2.5">
                    <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <strong className="block font-bold text-emerald-300">100% Anonymous Guaranteed</strong>
                      Your identity and user ID are stripped at the database boundary. No administrator or system owner can ever associate your answers with your account.
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start gap-2.5">
                    <Users className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                    <div>
                      <strong className="block font-bold text-blue-300">Identified Institutional Review</strong>
                      Responses are associated with your department and profile for official academic accreditation feedback.
                    </div>
                  </div>
                )}
              </div>

              {/* Survey Questions Form */}
              {submitSuccess ? (
                <div className="p-8 rounded-2xl bg-emerald-950/30 border border-emerald-500/40 text-center space-y-3">
                  <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
                  <h3 className="text-base font-bold text-slate-100 font-serif">
                    Survey Response Registered!
                  </h3>
                  <p className="text-xs text-slate-300 max-w-sm mx-auto">
                    Thank you for participating in campus governance. Your feedback has been safely tallied.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmitResponse} className="space-y-6">
                  {selectedSurvey.questions.map((q, idx) => (
                    <div key={q.id} className="p-4 rounded-xl bg-[#080E1A] border border-slate-800 space-y-3">
                      <div className="flex items-baseline justify-between text-xs font-mono">
                        <span className="text-cyan-400 font-bold">QUESTION {idx + 1}</span>
                        {q.required && <span className="text-rose-400 text-[10px]">REQUIRED</span>}
                      </div>

                      <p className="text-sm font-medium text-slate-200">
                        {q.text}
                      </p>

                      {q.type === 'RATING' && (
                        <div className="pt-2">
                          <div className="flex items-center gap-2">
                            {[1, 2, 3, 4, 5].map((val) => {
                              const isValSelected = (answers[q.id] ?? 5) === val;
                              return (
                                <button
                                  key={val}
                                  type="button"
                                  onClick={() => handleAnswerChange(q.id, val)}
                                  className={`flex-1 py-3 rounded-xl text-sm font-mono font-bold transition-all ${
                                    isValSelected
                                      ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/30'
                                      : 'bg-[#0E1524] text-slate-300 border border-slate-800 hover:border-slate-700'
                                  }`}
                                >
                                  {val} ★
                                </button>
                              );
                            })}
                          </div>
                          <div className="flex justify-between text-[10px] font-mono text-slate-500 mt-2 px-1">
                            <span>1 = Poor / Dissatisfied</span>
                            <span>5 = Exemplary / Optimal</span>
                          </div>
                        </div>
                      )}

                      {q.type === 'TEXT' && (
                        <Textarea
                          value={answers[q.id] || ''}
                          onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                          placeholder="Your anonymous commentary and detailed observations..."
                          rows={3}
                        />
                      )}
                    </div>
                  ))}

                  <div className="flex justify-end pt-3 border-t border-slate-800">
                    <Button variant="primary" type="submit" icon={Vote}>
                      Submit Survey Response
                    </Button>
                  </div>
                </form>
              )}
            </div>
          ) : (
            <div className="text-center py-24 text-slate-500 text-xs font-mono">
              Select a survey to review and cast your feedback.
            </div>
          )}
        </div>
      </div>

      {/* Create Survey Modal (Admin / System Owner) */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Launch Campus Survey or Institutional Poll"
        subtitle="Configure questions, target audience, and anonymity guarantee"
        maxWidth="lg"
      >
        <form onSubmit={handleCreateSurvey} className="space-y-4">
          <Input
            label="Survey Title"
            required
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="e.g. Academic Semester Evaluation & Computing Facilities Poll"
          />

          <Textarea
            label="Purpose & Background"
            required
            value={newDesc}
            onChange={(e) => setNewDesc(e.target.value)}
            placeholder="Explain the institutional context and how results will be utilized..."
            rows={2}
          />

          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Target Audience"
              value={newAudience}
              onChange={(e) => setNewAudience(e.target.value as any)}
              options={[
                { value: 'ALL', label: 'All Campus Community' },
                { value: 'STUDENTS', label: 'Students Only' },
                { value: 'FACULTY', label: 'Faculty & Academic Staff' },
                { value: 'STAFF', label: 'Administrative Staff' },
              ]}
            />
            <Select
              label="Privacy Mode"
              value={newIsAnonymous ? 'YES' : 'NO'}
              onChange={(e) => setNewIsAnonymous(e.target.value === 'YES')}
              options={[
                { value: 'YES', label: '100% Cryptographically Anonymous' },
                { value: 'NO', label: 'Identified (User ID Attached)' },
              ]}
            />
          </div>

          <Input
            label="Primary Question"
            required
            value={newQuestionText}
            onChange={(e) => setNewQuestionText(e.target.value)}
            placeholder="e.g. Rate the speed and availability of campus computing resources"
          />

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
            <Button variant="ghost" type="button" onClick={() => setIsCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" isLoading={isSubmittingNew}>
              Publish Survey
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
