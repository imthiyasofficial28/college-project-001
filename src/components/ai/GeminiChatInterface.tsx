import React, { useState, useEffect, useRef } from 'react';
import {
  Send,
  Bot,
  User,
  Sparkles,
  Search,
  Globe,
  ExternalLink,
  Copy,
  Check,
  RotateCcw,
  Sliders,
  Shield,
  GraduationCap,
  Wrench,
  Headphones,
  Cpu,
  Zap,
  Building,
  Info,
} from 'lucide-react';
import { api } from '../../lib/api.ts';
import { useAuth } from '../../lib/auth-context.tsx';
import { ChatMessage, GeminiModelChoice, ChatRolePreset } from '../../types/index.ts';
import { Button } from '../ui/button.tsx';
import { Badge } from '../ui/badge.tsx';

const ROLE_PRESETS: ChatRolePreset[] = [
  {
    id: 'director',
    label: 'Operations Director',
    roleTag: 'Executive Leadership',
    description: 'High-level institutional strategy, crisis escalation, and resource coordination.',
    systemInstruction:
      'You are the Executive Campus Operations Director for CUOIS. Provide decisive, high-level operational advice, risk assessments, and cross-departmental coordination policies.',
    suggestedPrompts: [
      'What are our top operational vulnerabilities across infrastructure and staffing today?',
      'Draft an executive memo for campus-wide energy conservation during peak heat hours.',
      'How should we allocate maintenance staff across academic blocks this week?',
    ],
  },
  {
    id: 'academic',
    label: 'Academic Dean',
    roleTag: 'Academic Governance',
    description: 'Curriculum scheduling, attendance compliance, accreditation, and exam audits.',
    systemInstruction:
      'You are the University Academic Dean & Registrar. Guide faculty on syllabus timelines, timetable conflicts, attendance debarment policies, and academic integrity.',
    suggestedPrompts: [
      'Summarize criteria for student attendance shortage appeals under University regulations.',
      'How can we resolve room allocation conflicts between Computer Science and Electrical labs?',
      'Generate guidelines for proctoring the upcoming midterm examination cycles.',
    ],
  },
  {
    id: 'security',
    label: 'SOC Security Chief',
    roleTag: 'Safety & Security',
    description: 'Perimeter defense, access authorization, surveillance, and emergency protocols.',
    systemInstruction:
      'You are the Chief of Campus Security & Emergency Operations. Focus on perimeter protection, visitor validation, incident de-escalation, and lockdown protocols.',
    suggestedPrompts: [
      'What are our security gate clearance requirements for late-night contractor deliveries?',
      'Draft a rapid incident response protocol for an unauthorized access trigger at Gate 3.',
      'Review night patrol route density for residential hostel sectors.',
    ],
  },
  {
    id: 'facilities',
    label: 'Facilities Engineer',
    roleTag: 'Physical Plant',
    description: 'HVAC systems, laboratory equipment uptime, and preventive maintenance.',
    systemInstruction:
      'You are the Senior University Physical Plant & Facilities Engineer. Provide technical guidance on mechanical systems, plumbing, power grid loads, and work order prioritization.',
    suggestedPrompts: [
      'What preventive maintenance checklist should we execute on the central chiller plant?',
      'Prioritize open high-priority work orders to minimize laboratory downtime.',
      'How do we calculate emergency generator run-time during a substation outage?',
    ],
  },
  {
    id: 'advising',
    label: 'Student Advisor',
    roleTag: 'Student Affairs',
    description: 'Student support, academic standing, grievance mediation, and campus life.',
    systemInstruction:
      'You are a Student Affairs & Academic Success Advisor. Speak with empathy, clarity, and constructive guidance regarding coursework, campus resources, and student wellbeing.',
    suggestedPrompts: [
      'A student has attendance below 70% due to medical reasons. What formal steps must they take?',
      'How can a resident student file an expedited maintenance request for hostel Wi-Fi?',
      'What mental health and counseling resources should be recommended during finals week?',
    ],
  },
];

export const GeminiChatInterface: React.FC = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try {
      const stored = sessionStorage.getItem('cuois_chat_history');
      if (stored) return JSON.parse(stored);
    } catch {}
    return [
      {
        id: 'welcome_1',
        role: 'model',
        content: `Hello ${user?.fullName || 'Colleague'}. I am your CUOIS Multi-Turn Intelligence Assistant, grounded in real-time university operations.\n\nYou can select specialized executive roles, toggle Google Search Grounding for live external knowledge, and choose between fast and deep reasoning models. How can I assist campus operations today?`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        modelUsed: 'gemini-3.5-flash',
      },
    ];
  });

  const [inputPrompt, setInputPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState<ChatRolePreset>(ROLE_PRESETS[0]);
  const [selectedModel, setSelectedModel] = useState<GeminiModelChoice>('gemini-3.5-flash');
  const [enableSearchGrounding, setEnableSearchGrounding] = useState(false);
  const [customInstruction, setCustomInstruction] = useState('');
  const [showConfig, setShowConfig] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const chatEndRef = useRef<HTMLDivElement>(null);

  // Sync to sessionStorage
  useEffect(() => {
    try {
      sessionStorage.setItem('cuois_chat_history', JSON.stringify(messages));
    } catch {}
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (promptToSend?: string) => {
    const text = (promptToSend || inputPrompt).trim();
    if (!text || isLoading) return;

    const userMessage: ChatMessage = {
      id: `usr_${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInputPrompt('');
    setIsLoading(true);

    try {
      const historyForApi = newMessages
        .filter((m) => !m.error)
        .map((m) => ({
          role: m.role,
          content: m.content,
        }));

      const activeSystemInstruction = customInstruction.trim() || selectedRole.systemInstruction;

      const res = await api.chatWithAI({
        messages: historyForApi,
        model: enableSearchGrounding ? 'gemini-3.5-flash' : selectedModel,
        systemInstruction: activeSystemInstruction,
        enableSearchGrounding,
      });

      const modelMessage: ChatMessage = {
        id: `ai_${Date.now()}`,
        role: 'model',
        content: res.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        modelUsed: res.modelUsed,
        groundingSources: res.groundingSources,
        searchQueries: res.searchQueries,
      };

      setMessages((prev) => [...prev, modelMessage]);
    } catch (err: any) {
      console.error('Chat error:', err);
      const errorMessage: ChatMessage = {
        id: `err_${Date.now()}`,
        role: 'model',
        content: `Error generating response: ${err.message || 'Check network connection or Gemini API credentials.'}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        error: true,
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearHistory = () => {
    if (confirm('Clear the current conversation thread?')) {
      const resetMsg: ChatMessage = {
        id: `welcome_${Date.now()}`,
        role: 'model',
        content: `Conversation reset. Switched to ${selectedRole.label} persona. Ready for next operational query.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        modelUsed: enableSearchGrounding ? 'gemini-3.5-flash' : selectedModel,
      };
      setMessages([resetMsg]);
      try {
        sessionStorage.removeItem('cuois_chat_history');
      } catch {}
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="flex flex-col h-[760px] rounded-2xl bg-[#0A101C] border border-slate-800 shadow-2xl overflow-hidden">
      {/* Top Header & Role / Model Bar */}
      <div className="p-4 bg-[#080D18] border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-violet-600/20 border border-violet-500/40 flex items-center justify-center text-violet-400">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-slate-100">{selectedRole.label}</span>
              <Badge variant="accent" size="sm">
                {selectedRole.roleTag}
              </Badge>
              {enableSearchGrounding && (
                <Badge variant="info" size="sm" dot>
                  Google Search Active
                </Badge>
              )}
            </div>
            <p className="text-[11px] text-slate-400 truncate max-w-md">{selectedRole.description}</p>
          </div>
        </div>

        {/* Configuration Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Search Grounding Toggle */}
          <button
            type="button"
            onClick={() => setEnableSearchGrounding((prev) => !prev)}
            title="Toggle Google Search Grounding (Uses gemini-3.5-flash)"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-all ${
              enableSearchGrounding
                ? 'bg-cyan-500/20 border border-cyan-400 text-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.3)]'
                : 'bg-[#0E1524] border border-slate-700 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Search Grounding</span>
          </button>

          {/* Model Selector */}
          <div className="relative">
            <select
              value={enableSearchGrounding ? 'gemini-3.5-flash' : selectedModel}
              onChange={(e) => setSelectedModel(e.target.value as GeminiModelChoice)}
              disabled={enableSearchGrounding}
              className="bg-[#0E1524] border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-violet-500 cursor-pointer disabled:opacity-60"
            >
              <option value="gemini-3.5-flash">gemini-3.5-flash (General & Search)</option>
              <option value="gemini-3.1-pro-preview">gemini-3.1-pro-preview (Complex Tasks)</option>
              <option value="gemini-3.1-flash-lite">gemini-3.1-flash-lite (Ultra Fast)</option>
            </select>
          </div>

          {/* Settings / Customize Drawer Toggle */}
          <button
            type="button"
            onClick={() => setShowConfig((prev) => !prev)}
            className={`p-1.5 rounded-lg border transition-colors ${
              showConfig
                ? 'bg-violet-600/30 border-violet-400 text-violet-300'
                : 'bg-[#0E1524] border-slate-700 text-slate-400 hover:text-slate-200'
            }`}
            title="Customize System Role & Persona"
          >
            <Sliders className="w-4 h-4" />
          </button>

          {/* Reset Thread */}
          <button
            type="button"
            onClick={handleClearHistory}
            className="p-1.5 rounded-lg bg-[#0E1524] border border-slate-700 text-slate-400 hover:text-rose-400 transition-colors"
            title="Clear Chat Thread"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Role Switcher & System Instruction Drawer */}
      {showConfig && (
        <div className="p-4 bg-[#070B14] border-b border-slate-800 space-y-3 animate-in slide-in-from-top-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-mono uppercase font-semibold text-violet-400">
              Select Institutional Persona
            </span>
            <span>Affects system instructions for multi-turn thread</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
            {ROLE_PRESETS.map((preset) => {
              const isActive = selectedRole.id === preset.id;
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => setSelectedRole(preset)}
                  className={`p-2 rounded-xl text-left border transition-all ${
                    isActive
                      ? 'bg-violet-950/40 border-violet-400 text-slate-100 shadow-md'
                      : 'bg-[#0E1524] border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                  }`}
                >
                  <div className="text-xs font-semibold">{preset.label}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5 truncate">{preset.roleTag}</div>
                </button>
              );
            })}
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-mono text-slate-400">
              Custom System Instruction (Optional override for current role):
            </label>
            <textarea
              rows={2}
              value={customInstruction}
              onChange={(e) => setCustomInstruction(e.target.value)}
              placeholder={selectedRole.systemInstruction}
              className="w-full bg-[#0E1524] border border-slate-700 rounded-lg p-2 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-violet-500 font-mono"
            />
          </div>
        </div>
      )}

      {/* Scrollable Message Thread */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 font-sans">
        {messages.map((msg) => {
          const isUser = msg.role === 'user';
          return (
            <div
              key={msg.id}
              className={`flex gap-3 max-w-3xl ${isUser ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}
            >
              {/* Avatar Icon */}
              <div
                className={`w-8 h-8 rounded-xl shrink-0 flex items-center justify-center text-xs font-mono ${
                  isUser
                    ? 'bg-cyan-500/20 border border-cyan-400/40 text-cyan-300'
                    : msg.error
                    ? 'bg-rose-500/20 border border-rose-500/40 text-rose-300'
                    : 'bg-violet-600/20 border border-violet-500/40 text-violet-300'
                }`}
              >
                {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              {/* Message Bubble */}
              <div
                className={`relative group rounded-2xl px-4 py-3 text-sm leading-relaxed border ${
                  isUser
                    ? 'bg-cyan-950/30 border-cyan-500/30 text-slate-100 rounded-tr-none'
                    : msg.error
                    ? 'bg-rose-950/20 border-rose-500/30 text-rose-200 rounded-tl-none'
                    : 'bg-[#0E1524] border-slate-800 text-slate-200 rounded-tl-none'
                }`}
              >
                {/* Header metadata */}
                <div className="flex items-center justify-between gap-4 mb-1 text-[10px] font-mono text-slate-400">
                  <span className="font-semibold text-slate-300">
                    {isUser ? user?.fullName || 'User' : selectedRole.label}
                  </span>
                  <div className="flex items-center gap-2">
                    {msg.modelUsed && (
                      <span className="px-1.5 py-0.5 rounded bg-slate-800 text-[9px] text-violet-400 font-mono">
                        {msg.modelUsed}
                      </span>
                    )}
                    <span>{msg.timestamp}</span>
                    <button
                      type="button"
                      onClick={() => handleCopy(msg.id, msg.content)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity hover:text-slate-100"
                      title="Copy response"
                    >
                      {copiedId === msg.id ? (
                        <Check className="w-3 h-3 text-emerald-400" />
                      ) : (
                        <Copy className="w-3 h-3 text-slate-400" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Message Body with clean paragraph breaks */}
                <div className="whitespace-pre-wrap font-sans text-xs sm:text-sm">
                  {msg.content}
                </div>

                {/* Search Grounding Sources / Citations */}
                {msg.groundingSources && msg.groundingSources.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-slate-800/80 space-y-1.5">
                    <div className="flex items-center gap-1 text-[11px] font-mono font-semibold text-cyan-400">
                      <Globe className="w-3 h-3" />
                      <span>Google Search Grounding Citations:</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {msg.groundingSources.map((source, sIdx) => (
                        <a
                          key={sIdx}
                          href={source.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-[#0A101C] hover:bg-slate-800 border border-cyan-500/30 hover:border-cyan-400 text-[11px] text-cyan-200 transition-colors"
                        >
                          <span className="truncate max-w-[220px]">{source.title}</span>
                          <ExternalLink className="w-2.5 h-2.5 text-cyan-400 shrink-0" />
                        </a>
                      ))}
                    </div>
                    {msg.searchQueries && msg.searchQueries.length > 0 && (
                      <div className="text-[10px] font-mono text-slate-400 mt-1">
                        Grounding query:{' '}
                        <span className="text-slate-300">
                          {msg.searchQueries.join(', ')}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {isLoading && (
          <div className="flex gap-3 max-w-xl mr-auto">
            <div className="w-8 h-8 rounded-xl bg-violet-600/20 border border-violet-500/40 flex items-center justify-center text-violet-300">
              <Sparkles className="w-4 h-4 animate-spin" />
            </div>
            <div className="p-3 rounded-2xl rounded-tl-none bg-[#0E1524] border border-slate-800 text-slate-400 text-xs font-mono flex items-center gap-2">
              <div className="flex gap-1">
                <span className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-bounce"></span>
                <span className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                <span className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-bounce [animation-delay:0.4s]"></span>
              </div>
              <span>
                {enableSearchGrounding
                  ? 'Grounding with Google Search via gemini-3.5-flash...'
                  : `Synthesizing response via ${selectedModel}...`}
              </span>
            </div>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Suggested Prompts for active role */}
      <div className="px-4 py-2 bg-[#080D18] border-t border-slate-800/80 flex items-center gap-2 overflow-x-auto text-[11px] font-mono scrollbar-none">
        <span className="text-slate-400 shrink-0">Prompts:</span>
        {selectedRole.suggestedPrompts.map((p, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => handleSendMessage(p)}
            className="px-2.5 py-1 rounded-full bg-[#0E1524] hover:bg-slate-800 border border-slate-700/60 text-slate-300 hover:text-slate-100 whitespace-nowrap transition-colors"
          >
            {p}
          </button>
        ))}
      </div>

      {/* Input Form */}
      <div className="p-4 bg-[#080D18] border-t border-slate-800">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center gap-3"
        >
          <div className="relative flex-1">
            <input
              type="text"
              value={inputPrompt}
              onChange={(e) => setInputPrompt(e.target.value)}
              placeholder={`Message ${selectedRole.label}... (e.g. Schedule constraints, security gates, student attendance)`}
              disabled={isLoading}
              className="w-full bg-[#0E1524] border border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-400/20 font-sans"
            />
          </div>

          <Button
            type="submit"
            variant="accent"
            size="md"
            disabled={!inputPrompt.trim() || isLoading}
            icon={Send}
            iconPosition="right"
          >
            Send
          </Button>
        </form>
      </div>
    </div>
  );
};
