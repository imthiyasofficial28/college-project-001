import React, { useState } from 'react';
import { Shield, Lock, ArrowRight, User, AlertTriangle, Key, Eye, EyeOff, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../lib/auth-context.tsx';
import { Button } from '../ui/button.tsx';

export const LoginView: React.FC = () => {
  const { institution, login } = useAuth();

  // Compulsory Member ID and Password state
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanId = identifier.trim();
    const cleanPass = password.trim();

    if (!cleanId || !cleanPass) {
      setError('Compulsory Requirement: You must enter both your assigned Member ID and Password.');
      return;
    }

    setIsLoading(true);
    try {
      await login(cleanId, cleanPass);
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please verify your Member ID and Password.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070B14] text-slate-100 flex flex-col justify-center items-center p-4 relative overflow-hidden">
      {/* Ambient background glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[650px] h-[360px] bg-cyan-500/10 rounded-full blur-[150px] pointer-events-none" />

      <div className="w-full max-w-md z-10 space-y-5">
        {/* Campus Seal & Title */}
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500 via-blue-600 to-indigo-700 p-0.5 flex items-center justify-center mx-auto mb-3 shadow-[0_0_30px_rgba(6,182,212,0.35)]">
            <div className="w-full h-full bg-[#070B14] rounded-[14px] flex items-center justify-center font-serif text-cyan-400 font-bold text-2xl">
              C
            </div>
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-slate-100 tracking-tight">
            {institution?.name || 'CUOIS Enterprise Platform'}
          </h1>
          <p className="text-xs font-mono text-cyan-400 uppercase tracking-widest mt-1">
            Campus Unified Operations & Intelligence System
          </p>
        </div>

        {/* Compulsory Authentication Security Notice */}
        <div className="p-3.5 rounded-xl bg-[#0B1324] border border-cyan-500/30 text-slate-300 text-xs shadow-lg space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-cyan-400 font-semibold">
              <Lock className="w-4 h-4 text-cyan-400" />
              <span>Strict Authentication Verification Gate</span>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 font-bold">
              VERIFIED ACCESS ONLY
            </span>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Random Member IDs or incorrect passwords are strictly rejected. Only registered campus accounts authenticated against the secure database can enter.
          </p>
          <div className="pt-1.5 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-1 text-[10px] font-mono text-slate-400">
            <span>Sovereign Owner ID: <strong className="text-cyan-300">IMTHIYAS</strong></span>
            <span className="text-slate-500">|</span>
            <span>Password: <strong className="text-cyan-300">Imthiyas@12345</strong></span>
          </div>
        </div>

        {/* Form Container */}
        <div className="bg-[#0E1524] border border-slate-800 rounded-2xl shadow-2xl p-6 sm:p-7">
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-rose-950/50 border border-rose-500/40 text-rose-300 text-xs font-mono flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Member ID / Campus Username <span className="text-cyan-400">*</span>
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  autoFocus
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="Enter your Member ID..."
                  className="w-full bg-[#0A101D] border border-slate-700 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 outline-none transition-all font-mono"
                />
              </div>
              <p className="text-[10px] text-slate-500 mt-1">
                Enter your unique confidential Member ID.
              </p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-medium text-slate-300">
                  Account Password <span className="text-cyan-400">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-[11px] text-slate-400 hover:text-cyan-400 flex items-center gap-1 transition-colors"
                >
                  {showPassword ? (
                    <>
                      <EyeOff className="w-3.5 h-3.5" />
                      <span>Hide</span>
                    </>
                  ) : (
                    <>
                      <Eye className="w-3.5 h-3.5" />
                      <span>Show</span>
                    </>
                  )}
                </button>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your security password"
                  className="w-full bg-[#0A101D] border border-slate-700 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 rounded-xl pl-10 pr-10 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 outline-none transition-all font-mono"
                />
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full mt-2 font-medium"
              isLoading={isLoading}
              icon={ArrowRight}
              iconPosition="right"
            >
              Verify Credentials & Enter Campus
            </Button>
          </form>
        </div>

        {/* Developer & Sovereign Ownership Accreditation */}
        <div className="p-4 rounded-xl bg-[#090F1C] border border-cyan-500/30 text-center shadow-lg">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 text-[10px] font-mono mb-1.5 font-bold uppercase tracking-wider">
            <Shield className="w-3 h-3 text-cyan-400" />
            <span>Lead Architect & Sovereign Ownership</span>
          </div>
          <p className="text-xs font-semibold text-slate-100">
            Completely Developed & Architected by <span className="text-cyan-400 font-bold">Imthiyas</span>
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Sovereign System Owner: <span className="text-slate-200 font-medium">Imthiyas</span> • Support: <a href="mailto:imthiyasofficial28@gmail.com" className="text-cyan-400 underline hover:text-cyan-300">imthiyasofficial28@gmail.com</a>
          </p>
        </div>

        {/* Security badge footer */}
        <div className="text-center flex items-center justify-center gap-2 text-[11px] text-slate-500 font-mono">
          <Key className="w-3.5 h-3.5 text-slate-500" />
          <span>PBKDF2 SHA-512 Cryptographic Auth • Zero Unauthenticated Entry</span>
        </div>
      </div>
    </div>
  );
};
