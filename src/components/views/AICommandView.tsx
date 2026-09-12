import React, { useState, useEffect } from 'react';
import {
  BrainCircuit,
  MessageSquare,
  Radio,
  Sparkles,
  Send,
  Database,
  CheckCircle2,
  Calculator,
  TrendingUp,
  AlertCircle,
  Lightbulb,
  ShieldCheck,
  RefreshCw,
  Globe,
  Sliders,
} from 'lucide-react';
import { api } from '../../lib/api.ts';
import { useAuth } from '../../lib/auth-context.tsx';
import { AIInsight } from '../../types/index.ts';
import { Button } from '../ui/button.tsx';
import { Badge } from '../ui/badge.tsx';
import { GeminiChatInterface } from '../ai/GeminiChatInterface.tsx';
import { GeminiLiveVoiceInterface } from '../ai/GeminiLiveVoiceInterface.tsx';

export const AICommandView: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'chat' | 'voice' | 'deep-analytics'>('chat');
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [query, setQuery] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeResult, setActiveResult] = useState<{
    query: string;
    response: string;
    breakdown: {
      facts: string[];
      calculations: string[];
      predictions: string[];
      recommendations: string[];
    };
    groundedEntities: string[];
    confidence: number;
  } | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const ins = await api.getAIInsights();
        setInsights(ins);
      } catch (err) {
        console.error(err);
      }
    })();
  }, []);

  const handleRunQuery = async (queryText: string) => {
    if (!queryText.trim()) return;
    setIsProcessing(true);
    try {
      const res = await api.queryAI(queryText);
      setActiveResult(res);
      setQuery('');
    } catch (err: any) {
      alert(err.message || 'AI Query processing failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const presetQueries = [
    'Analyze current attendance shortages and predict admit card impact',
    'Evaluate active facilities grievances and highlight SLA breach risks',
    'Summarize campus security perimeter posture and incident frequency',
    'Review classroom capacity utilization and timetable constraints',
  ];

  return (
    <div className="space-y-6">
      {/* Executive Intelligence Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono font-semibold uppercase tracking-wider text-violet-400">
              CAMPUS UNIFIED INTELLIGENCE SYSTEM
            </span>
            <Badge variant="accent" size="sm" dot>
              GEMINI CORE
            </Badge>
          </div>
          <h1 className="text-xl font-serif font-bold text-slate-100 flex items-center gap-2">
            <BrainCircuit className="w-5 h-5 text-violet-400" />
            AI Operations & Voice Command Core
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Multi-turn contextual reasoning, real-time Gemini Live Voice streaming, and Google Search Grounding across campus data.
          </p>
        </div>

        {/* Mode Navigation Tabs */}
        <div className="flex items-center p-1 rounded-xl bg-[#0A101C] border border-slate-800 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setActiveTab('chat')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'chat'
                ? 'bg-violet-600/30 border border-violet-500/40 text-violet-200 shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>Multi-Turn Chat</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('voice')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'voice'
                ? 'bg-rose-600/30 border border-rose-500/40 text-rose-200 shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Radio className="w-4 h-4 text-rose-400" />
            <span>Live Voice (Live API)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('deep-analytics')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'deep-analytics'
                ? 'bg-cyan-600/30 border border-cyan-500/40 text-cyan-200 shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Database className="w-4 h-4 text-cyan-400" />
            <span>Operational Quadrants</span>
          </button>
        </div>
      </div>

      {/* Tab 1: Multi-turn Chatbot with Role Personas & Search Grounding */}
      {activeTab === 'chat' && (
        <div className="space-y-4 animate-in fade-in">
          <GeminiChatInterface />
        </div>
      )}

      {/* Tab 2: Gemini Live Voice with 16kHz PCM and 24kHz Audio Output */}
      {activeTab === 'voice' && (
        <div className="space-y-4 animate-in fade-in">
          <GeminiLiveVoiceInterface />
        </div>
      )}

      {/* Tab 3: Structured 4-Quadrant Operational Analytics */}
      {activeTab === 'deep-analytics' && (
        <div className="space-y-6 animate-in fade-in">
          {/* Query Console */}
          <div className="p-5 rounded-2xl bg-[#0A101C] border border-violet-500/30 shadow-xl space-y-4">
            <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
              <Database className="w-3.5 h-3.5 text-cyan-400" />
              <span>Context: Grounded in Attendance, Rosters, Timetable, Facilities & Security</span>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleRunQuery(query);
              }}
              className="flex flex-col sm:flex-row gap-3"
            >
              <div className="relative flex-1">
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Ask an operational question (e.g. Which labs have active heat tickets? Or Which students face attendance debarment?)"
                  className="w-full bg-[#0E1524] border border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-400/20 font-sans"
                />
              </div>
              <Button
                type="submit"
                variant="accent"
                size="lg"
                isLoading={isProcessing}
                icon={Send}
                iconPosition="right"
              >
                Synthesize
              </Button>
            </form>

            {/* Preset query chips */}
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800">
              <span className="text-[11px] font-mono text-slate-400">Quick Inquiries:</span>
              {presetQueries.map((pq) => (
                <button
                  key={pq}
                  type="button"
                  onClick={() => handleRunQuery(pq)}
                  className="px-2.5 py-1 rounded-full bg-[#0E1524] hover:bg-slate-800 border border-slate-700/60 text-slate-300 hover:text-slate-100 text-[11px] font-mono transition-colors"
                >
                  {pq}
                </button>
              ))}
            </div>
          </div>

          {/* Live AI Result Section */}
          {activeResult && (
            <div className="p-6 rounded-2xl bg-[#0E1524] border border-violet-500/40 shadow-2xl space-y-6 animate-in fade-in">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
                <div>
                  <div className="text-[11px] font-mono text-violet-400 uppercase tracking-wider">
                    QUERY INFERENCE
                  </div>
                  <h2 className="text-base font-semibold text-slate-100 mt-0.5">
                    "{activeResult.query}"
                  </h2>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant="accent" size="sm">
                    Confidence: {(activeResult.confidence * 100).toFixed(0)}%
                  </Badge>
                  <Badge variant="info" size="sm">
                    {activeResult.groundedEntities.length} Entities Grounded
                  </Badge>
                </div>
              </div>

              {/* Executive Synthesis */}
              <div className="p-4 rounded-xl bg-violet-950/30 border border-violet-500/20">
                <div className="flex items-center gap-2 text-xs font-semibold text-violet-300 uppercase tracking-wide font-mono mb-2">
                  <Sparkles className="w-4 h-4 text-violet-400" />
                  <span>Executive Synthesis</span>
                </div>
                <p className="text-sm text-slate-200 leading-relaxed font-sans">
                  {activeResult.response}
                </p>
              </div>

              {/* Strict 4-Quadrant Compartmentalization */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 1. FACTS */}
                <div className="p-4 rounded-xl bg-[#0A101C] border border-slate-800 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-semibold text-cyan-400 uppercase tracking-wider font-mono">
                    <CheckCircle2 className="w-4 h-4 text-cyan-400" />
                    <span>Observable Database Facts</span>
                  </div>
                  <ul className="space-y-1.5 text-xs text-slate-300 leading-relaxed list-disc list-inside">
                    {activeResult.breakdown.facts.map((f, i) => (
                      <li key={i}>{f}</li>
                    ))}
                  </ul>
                </div>

                {/* 2. CALCULATIONS */}
                <div className="p-4 rounded-xl bg-[#0A101C] border border-slate-800 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 uppercase tracking-wider font-mono">
                    <Calculator className="w-4 h-4 text-emerald-400" />
                    <span>Calculated Metrics & Aggregates</span>
                  </div>
                  <ul className="space-y-1.5 text-xs text-slate-300 leading-relaxed list-disc list-inside">
                    {activeResult.breakdown.calculations.map((c, i) => (
                      <li key={i}>{c}</li>
                    ))}
                  </ul>
                </div>

                {/* 3. PREDICTIONS */}
                <div className="p-4 rounded-xl bg-[#0A101C] border border-slate-800 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-semibold text-amber-400 uppercase tracking-wider font-mono">
                    <TrendingUp className="w-4 h-4 text-amber-400" />
                    <span>Forward Projections & Capacity Risks</span>
                  </div>
                  <ul className="space-y-1.5 text-xs text-slate-300 leading-relaxed list-disc list-inside">
                    {activeResult.breakdown.predictions.map((p, i) => (
                      <li key={i}>{p}</li>
                    ))}
                  </ul>
                </div>

                {/* 4. RECOMMENDATIONS */}
                <div className="p-4 rounded-xl bg-[#0A101C] border border-slate-800 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-semibold text-violet-400 uppercase tracking-wider font-mono">
                    <Lightbulb className="w-4 h-4 text-violet-400" />
                    <span>Actionable Institutional Advice</span>
                  </div>
                  <ul className="space-y-1.5 text-xs text-slate-300 leading-relaxed list-disc list-inside">
                    {activeResult.breakdown.recommendations.map((r, i) => (
                      <li key={i}>{r}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Pre-Computed Telemetry Insights Feed */}
          <div className="space-y-3">
            <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider font-mono">
              Persistent Operational Insights Matrix
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {insights.map((ins) => (
                <div
                  key={ins.id}
                  className="p-4 rounded-xl bg-[#0A101C] border border-slate-800 hover:border-slate-700 transition-all space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <Badge
                      variant={
                        ins.type === 'PREDICTION'
                          ? 'warning'
                          : ins.type === 'RECOMMENDATION'
                          ? 'accent'
                          : ins.type === 'CALCULATION'
                          ? 'info'
                          : 'neutral'
                      }
                      size="sm"
                    >
                      {ins.type}
                    </Badge>
                    <span className="text-[10px] font-mono text-slate-400">
                      {(ins.confidenceScore * 100).toFixed(0)}% confidence
                    </span>
                  </div>
                  <h3 className="text-sm font-semibold text-slate-100">{ins.title}</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">{ins.content}</p>
                  {ins.suggestedAction && (
                    <div className="pt-2 flex items-center justify-between text-[11px] text-cyan-400 font-mono">
                      <span>Action Required: Immediate</span>
                      <button
                        onClick={() => handleRunQuery(ins.title)}
                        className="hover:underline flex items-center gap-1 text-slate-300 hover:text-cyan-300"
                      >
                        Deep Dive →
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
