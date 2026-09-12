import React, { useState } from 'react';
import {
  Mic,
  MicOff,
  Radio,
  Volume2,
  VolumeX,
  PhoneCall,
  PhoneOff,
  Sparkles,
  AlertCircle,
  Activity,
  Cpu,
  Info,
  Send,
} from 'lucide-react';
import { useLiveVoice } from '../../lib/useLiveVoice.ts';
import { Button } from '../ui/button.tsx';
import { Badge } from '../ui/badge.tsx';

export const GeminiLiveVoiceInterface: React.FC = () => {
  const {
    isConnected,
    isConnecting,
    isMicActive,
    isModelSpeaking,
    audioVolume,
    statusText,
    error,
    transcripts,
    connect,
    disconnect,
    startMic,
    stopMic,
    sendTextMessage,
  } = useLiveVoice();

  const [textInput, setTextInput] = useState('');

  const handleSendText = (e: React.FormEvent) => {
    e.preventDefault();
    if (!textInput.trim() || !isConnected) return;
    sendTextMessage(textInput.trim());
    setTextInput('');
  };

  const samplePrompts = [
    'What is the current attendance status across classes?',
    'Report any active maintenance work orders in Engineering Block.',
    'Are there any elevated security watch alerts at campus gates?',
    'Explain the university debarment criteria for exams.',
  ];

  return (
    <div className="rounded-2xl bg-[#0A101C] border border-slate-800 shadow-2xl p-6 space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Badge variant="accent" size="sm" dot>
              LIVE AUDIO WEBSOCKET
            </Badge>
            <Badge variant="neutral" size="sm">
              gemini-3.1-flash-live-preview
            </Badge>
          </div>
          <h2 className="text-lg font-serif font-bold text-slate-100 flex items-center gap-2">
            <Radio className="w-5 h-5 text-rose-400 animate-pulse" />
            Gemini Live Voice Communications
          </h2>
          <p className="text-xs text-slate-400">
            Real-time bidirectional conversational audio stream over 16kHz PCM (Mic) and 24kHz neural speech output.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {!isConnected ? (
            <Button
              variant="accent"
              size="md"
              isLoading={isConnecting}
              icon={PhoneCall}
              onClick={connect}
            >
              Start Voice Call
            </Button>
          ) : (
            <Button
              variant="danger"
              size="md"
              icon={PhoneOff}
              onClick={disconnect}
            >
              End Voice Call
            </Button>
          )}
        </div>
      </div>

      {/* Error alert */}
      {error && (
        <div className="p-3.5 rounded-xl bg-rose-950/30 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Central Visualizer & Radar Stage */}
      <div className="relative py-12 flex flex-col items-center justify-center rounded-2xl bg-[#070B14] border border-slate-800/80 overflow-hidden">
        {/* Animated Background Rings */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div
            className={`w-48 h-48 rounded-full border transition-all duration-300 ${
              isConnected
                ? isModelSpeaking
                  ? 'border-violet-500/50 scale-125 bg-violet-500/5 animate-ping'
                  : isMicActive
                  ? 'border-cyan-500/40 scale-110 bg-cyan-500/5'
                  : 'border-slate-700/30 scale-100'
                : 'border-slate-800/20'
            }`}
          />
          <div
            className={`w-72 h-72 rounded-full border transition-all duration-500 ${
              isConnected
                ? isModelSpeaking
                  ? 'border-violet-400/20 scale-110'
                  : 'border-cyan-400/10'
                : 'border-slate-800/10'
            }`}
          />
        </div>

        {/* Center Orb */}
        <div className="relative z-10 flex flex-col items-center space-y-4">
          <button
            type="button"
            onClick={() => {
              if (!isConnected) {
                connect();
              } else if (isMicActive) {
                stopMic();
              } else {
                startMic();
              }
            }}
            className={`relative w-28 h-28 rounded-full flex items-center justify-center transition-all duration-300 shadow-2xl ${
              !isConnected
                ? 'bg-slate-800 text-slate-400 hover:bg-slate-700 border-2 border-slate-700'
                : isModelSpeaking
                ? 'bg-gradient-to-tr from-violet-600 to-indigo-500 text-white shadow-[0_0_40px_rgba(139,92,246,0.6)] scale-105'
                : isMicActive
                ? 'bg-gradient-to-tr from-cyan-600 to-teal-500 text-white shadow-[0_0_35px_rgba(6,182,212,0.5)] scale-105'
                : 'bg-amber-600/30 text-amber-300 border border-amber-500'
            }`}
          >
            {/* Audio Wave Volume Ring */}
            {isConnected && isMicActive && (
              <span
                className="absolute inset-0 rounded-full border-2 border-cyan-300 transition-transform duration-75 pointer-events-none"
                style={{
                  transform: `scale(${1 + audioVolume * 0.4})`,
                  opacity: Math.max(0.3, audioVolume),
                }}
              />
            )}

            {!isConnected ? (
              <MicOff className="w-10 h-10" />
            ) : isModelSpeaking ? (
              <Volume2 className="w-10 h-10 animate-bounce" />
            ) : isMicActive ? (
              <Mic className="w-10 h-10" />
            ) : (
              <MicOff className="w-10 h-10" />
            )}
          </button>

          {/* Status Text Pill */}
          <div className="flex flex-col items-center space-y-1 text-center">
            <div className="flex items-center gap-2">
              <span
                className={`w-2 h-2 rounded-full ${
                  isConnected
                    ? isModelSpeaking
                      ? 'bg-violet-400 animate-pulse'
                      : isMicActive
                      ? 'bg-emerald-400 animate-ping'
                      : 'bg-amber-400'
                    : 'bg-slate-600'
                }`}
              />
              <span className="text-xs font-mono font-medium text-slate-200">
                {statusText}
              </span>
            </div>
            <span className="text-[11px] font-mono text-slate-400">
              {isConnected
                ? isMicActive
                  ? 'Microphone streaming (16kHz PCM). Speak freely or test prompts below.'
                  : 'Microphone muted. Click orb to resume speaking.'
                : 'Click "Start Voice Call" or click the center orb to connect to Gemini Live.'}
            </span>
          </div>

          {/* Audio Wave Bars */}
          {isConnected && (
            <div className="flex items-center gap-1 h-6">
              {[40, 70, 30, 90, 60, 100, 50, 80, 45, 95, 65, 35].map((height, i) => (
                <span
                  key={i}
                  className={`w-1 rounded-full transition-all duration-100 ${
                    isModelSpeaking
                      ? 'bg-violet-400'
                      : isMicActive
                      ? 'bg-cyan-400'
                      : 'bg-slate-700'
                  }`}
                  style={{
                    height: isConnected
                      ? isModelSpeaking
                        ? `${Math.max(4, Math.random() * 24)}px`
                        : `${Math.max(4, audioVolume * height * 0.25)}px`
                      : '4px',
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Suggested Spoken Phrases */}
      <div className="space-y-2">
        <div className="flex items-center gap-1.5 text-xs font-mono text-slate-400">
          <Sparkles className="w-3.5 h-3.5 text-violet-400" />
          <span>Quick voice inquiry starters:</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {samplePrompts.map((prompt, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => {
                if (isConnected) {
                  sendTextMessage(prompt);
                } else {
                  connect();
                }
              }}
              className="p-2.5 rounded-xl bg-[#0E1524] hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-left text-xs text-slate-300 transition-colors flex items-center justify-between group"
            >
              <span className="truncate pr-2">{prompt}</span>
              <span className="text-[10px] font-mono text-violet-400 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                Ask ↵
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Text fallback input during voice call */}
      {isConnected && (
        <form onSubmit={handleSendText} className="flex gap-2">
          <input
            type="text"
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            placeholder="Or type text into the live session..."
            className="flex-1 bg-[#0E1524] border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-violet-500"
          />
          <Button type="submit" variant="secondary" size="sm" icon={Send}>
            Send to Voice
          </Button>
        </form>
      )}

      {/* Realtime Live Telemetry Notes */}
      <div className="p-3.5 rounded-xl bg-[#070B14] border border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-400 font-mono">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-emerald-400" />
          <span>Live API Protocol: WebSockets + Google GenAI Modality.AUDIO</span>
        </div>
        <div className="flex items-center gap-3">
          <span>Model: gemini-3.1-flash-live-preview</span>
          <span>Voice: Zephyr</span>
        </div>
      </div>
    </div>
  );
};
