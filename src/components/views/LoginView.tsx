import React, { useState } from 'react';
import { Shield, Lock, Mail, ArrowRight, UserCheck, AlertTriangle } from 'lucide-react';
import { useAuth } from '../../lib/auth-context.tsx';
import { Button } from '../ui/button.tsx';
import { Input } from '../ui/input.tsx';

export const LoginView: React.FC = () => {
  const { institution, login } = useAuth();

  const [email, setEmail] = useState('chancellor@apexhorizon.edu');
  const [password, setPassword] = useState('Cuois@2025');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      await login(email, password);
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const quickLogins = [
    { label: 'System Owner', email: 'chancellor@apexhorizon.edu', pass: 'Cuois@2025', role: 'Full Sovereignty' },
    { label: 'Faculty Lead', email: 'elena.rostova@apexhorizon.edu', pass: 'Cuois@2025', role: 'Academics & Attendance' },
    { label: 'Student', email: 'marcus.chen@student.apexhorizon.edu', pass: 'Cuois@2025', role: 'Student Portal & Timetable' },
    { label: 'Security Officer', email: 'vikram.singh@apexhorizon.edu', pass: 'Cuois@2025', role: 'Perimeter & Gates' },
  ];

  return (
    <div className="min-h-screen bg-[#070B14] text-slate-100 flex flex-col justify-center items-center p-4 relative overflow-hidden">
      {/* Ambient background glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-cyan-500/10 rounded-full blur-[150px] pointer-events-none" />

      <div className="w-full max-w-md z-10">
        {/* Campus Seal & Title */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 p-0.5 flex items-center justify-center mx-auto mb-4 shadow-[0_0_30px_rgba(6,182,212,0.3)]">
            <div className="w-full h-full bg-[#070B14] rounded-[14px] flex items-center justify-center font-serif text-cyan-400 font-bold text-2xl">
              C
            </div>
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-slate-100 tracking-tight">
            {institution?.name || 'CUOIS Platform'}
          </h1>
          <p className="text-xs font-mono text-cyan-400 uppercase tracking-widest mt-1">
            Campus Operations & Intelligence System
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-[#0E1524] border border-slate-700/80 rounded-2xl shadow-2xl p-6 sm:p-8">
          {error && (
            <div className="mb-5 p-3.5 rounded-xl bg-rose-950/40 border border-rose-500/40 text-rose-300 text-xs font-mono flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <Input
              label="Campus Institutional Email / Username"
              required
              type="text"
              icon={Mail}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. name@apexhorizon.edu"
            />

            <Input
              label="Access Passcode"
              required
              type="password"
              icon={Lock}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
            />

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full mt-2"
              isLoading={isLoading}
              icon={ArrowRight}
              iconPosition="right"
            >
              Authorize & Enter Command Center
            </Button>
          </form>

          {/* Quick Demo Access Pills */}
          <div className="mt-8 pt-6 border-t border-slate-800">
            <div className="flex items-center gap-2 mb-3">
              <UserCheck className="w-3.5 h-3.5 text-cyan-400" />
              <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-slate-400">
                Quick Role Credentials
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {quickLogins.map((item) => (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => {
                    setEmail(item.email);
                    setPassword(item.pass);
                  }}
                  className="p-2 text-left rounded-lg bg-[#0A101C] hover:bg-[#121A2D] border border-slate-800 hover:border-slate-700 transition-colors"
                >
                  <div className="text-xs font-semibold text-slate-200">{item.label}</div>
                  <div className="text-[10px] text-cyan-400/80 font-mono truncate">{item.role}</div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Security badge footer */}
        <div className="text-center mt-6 flex items-center justify-center gap-2 text-[11px] text-slate-500 font-mono">
          <Shield className="w-3.5 h-3.5 text-slate-500" />
          <span>RBAC Enforced • PBKDF2 Password Derivation</span>
        </div>
      </div>
    </div>
  );
};
