import React, { useState } from 'react';
import { Building2, ShieldCheck, Sparkles, ArrowRight, Layers, Lock, Mail, User, Phone, MapPin } from 'lucide-react';
import { useAuth } from '../../lib/auth-context.tsx';
import { Button } from '../ui/button.tsx';
import { Input, Select } from '../ui/input.tsx';

export const BootstrapSetupView: React.FC = () => {
  const { bootstrap } = useAuth();

  // No random demo data prefilled - clean blank initial state
  const [institutionName, setInstitutionName] = useState('');
  const [institutionCode, setInstitutionCode] = useState('');
  const [institutionType, setInstitutionType] = useState('UNIVERSITY');
  const [address, setAddress] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');

  // Sovereign System Owner: Imthiyas
  const [ownerName, setOwnerName] = useState('Imthiyas');
  const [ownerEmail, setOwnerEmail] = useState('imthiyasofficial28@gmail.com');
  const [ownerPassword, setOwnerPassword] = useState('');

  // Default to Clean Empty Slate as requested by user
  const [template, setTemplate] = useState<'UNIVERSITY_ENTERPRISE' | 'EMPTY'>('EMPTY');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      await bootstrap({
        institution: {
          name: institutionName.trim() || 'Campus University',
          code: institutionCode.trim() || 'CAMPUS',
          type: institutionType,
          address: address.trim(),
          contactEmail: contactEmail.trim() || ownerEmail.trim(),
          contactPhone: contactPhone.trim(),
        },
        owner: {
          fullName: ownerName.trim() || 'Imthiyas',
          email: ownerEmail.trim() || 'imthiyasofficial28@gmail.com',
          password: ownerPassword.trim() || 'Cuois@2025',
        },
        template,
      });
    } catch (err: any) {
      setError(err.message || 'Failed to initialize campus operating system.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070B14] text-slate-100 flex flex-col justify-center items-center p-4 sm:p-6 lg:p-8 relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-blue-600/10 rounded-full blur-[140px] pointer-events-none" />

      <div className="w-full max-w-3xl z-10">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/60 border border-cyan-500/30 text-cyan-400 text-xs font-mono mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            <span>FIRST RUN SETUP WIZARD — EMPTY-FIRST SOVEREIGN ARCHITECTURE</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-serif font-bold text-slate-100 tracking-tight">
            Bootstrap Campus Digital OS
          </h1>
          <p className="text-sm text-slate-400 mt-2 max-w-lg mx-auto leading-relaxed">
            CUOIS has detected an unconfigured slate. Provision your institutional identity and root sovereign System Owner credentials to take full control.
          </p>
        </div>

        {/* Developer & Sovereign Ownership Banner */}
        <div className="mb-6 p-5 rounded-2xl bg-gradient-to-r from-cyan-950/70 via-[#0B1528] to-blue-950/70 border border-cyan-500/40 shadow-xl relative overflow-hidden">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2 py-0.5 rounded-md bg-cyan-500/20 text-cyan-300 text-[10px] font-mono font-bold uppercase tracking-wider border border-cyan-500/30">
                  Lead Software Architect & Owner
                </span>
                <span className="text-[11px] font-mono text-emerald-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" /> Verified Sovereign
                </span>
              </div>
              <h2 className="text-lg font-bold font-serif text-slate-100">
                Completely Developed & Architected by Imthiyas
              </h2>
              <p className="text-xs text-slate-300 mt-1">
                Sovereign System Owner: <strong className="text-cyan-400">Imthiyas</strong> • Official Contact: <a href="mailto:imthiyasofficial28@gmail.com" className="text-cyan-400 underline hover:text-cyan-300">imthiyasofficial28@gmail.com</a>
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Zero random dummy data forced. You have full root governance to define your campus entities and digital twin physical assets.
              </p>
            </div>
            <div className="p-3 rounded-xl bg-[#080D1A] border border-cyan-500/30 text-center shrink-0">
              <span className="text-[10px] font-mono text-slate-400 uppercase block">Platform Authority</span>
              <span className="text-xs font-mono font-bold text-cyan-400">IMTHIYAS ROOT</span>
            </div>
          </div>
        </div>

        {/* Wizard Card */}
        <div className="bg-[#0E1524] border border-slate-700/80 rounded-2xl shadow-2xl p-6 sm:p-8">
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-rose-950/40 border border-rose-500/40 text-rose-300 text-xs font-mono">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Step 1: Institutional Profile */}
            <div>
              <div className="flex items-center gap-2.5 pb-2 mb-4 border-b border-slate-800">
                <Building2 className="w-4 h-4 text-cyan-400" />
                <h2 className="text-sm font-semibold text-slate-200 tracking-wide uppercase font-mono">
                  1. Institutional Entity Definition
                </h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <Input
                    label="Institution Official Name"
                    required
                    value={institutionName}
                    onChange={(e) => setInstitutionName(e.target.value)}
                    placeholder="Enter your campus / university name..."
                  />
                </div>
                <div>
                  <Input
                    label="Institutional Code"
                    required
                    value={institutionCode}
                    onChange={(e) => setInstitutionCode(e.target.value.toUpperCase())}
                    placeholder="e.g. CUOIS"
                  />
                </div>
                <div>
                  <Select
                    label="Campus Institution Type"
                    value={institutionType}
                    onChange={(e) => setInstitutionType(e.target.value)}
                    options={[
                      { value: 'UNIVERSITY', label: 'University (Multi-Faculty)' },
                      { value: 'INSTITUTE', label: 'Institute of Technology' },
                      { value: 'COLLEGE', label: 'Autonomous College' },
                      { value: 'SCHOOL_DISTRICT', label: 'Educational Campus' },
                    ]}
                  />
                </div>
                <div className="sm:col-span-2">
                  <Input
                    label="Physical Address / Campus Bounds"
                    icon={MapPin}
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Street, City, Country"
                  />
                </div>
                <div>
                  <Input
                    label="Official Contact Email"
                    icon={Mail}
                    type="email"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    placeholder="contact@campus.edu"
                  />
                </div>
                <div>
                  <Input
                    label="Emergency / Switchboard Phone"
                    icon={Phone}
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    placeholder="+1 (555) 010-0000"
                  />
                </div>
              </div>
            </div>

            {/* Step 2: System Owner Credentials */}
            <div>
              <div className="flex items-center gap-2.5 pb-2 mb-4 border-b border-slate-800">
                <ShieldCheck className="w-4 h-4 text-cyan-400" />
                <h2 className="text-sm font-semibold text-slate-200 tracking-wide uppercase font-mono">
                  2. Root Sovereign System Owner
                </h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <Input
                    label="System Owner Full Name & Title"
                    required
                    icon={User}
                    value={ownerName}
                    onChange={(e) => setOwnerName(e.target.value)}
                    placeholder="Imthiyas (System Owner)"
                  />
                </div>
                <div>
                  <Input
                    label="Root Administrative Email"
                    required
                    type="email"
                    icon={Mail}
                    value={ownerEmail}
                    onChange={(e) => setOwnerEmail(e.target.value)}
                    placeholder="imthiyasofficial28@gmail.com"
                  />
                </div>
                <div>
                  <Input
                    label="Master Password (Cryptographic PBKDF2)"
                    required
                    type="password"
                    icon={Lock}
                    value={ownerPassword}
                    onChange={(e) => setOwnerPassword(e.target.value)}
                    placeholder="Set master access password"
                    helperText="Enforced salted PBKDF2 derivation."
                  />
                </div>
              </div>
            </div>

            {/* Step 3: Initialization Template */}
            <div>
              <div className="flex items-center gap-2.5 pb-2 mb-3 border-b border-slate-800">
                <Layers className="w-4 h-4 text-cyan-400" />
                <h2 className="text-sm font-semibold text-slate-200 tracking-wide uppercase font-mono">
                  3. Initialization Seed Strategy
                </h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div
                  onClick={() => setTemplate('UNIVERSITY_ENTERPRISE')}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    template === 'UNIVERSITY_ENTERPRISE'
                      ? 'bg-cyan-950/40 border-cyan-500/60 shadow-[0_0_15px_rgba(6,182,212,0.15)]'
                      : 'bg-[#0A101C] border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-bold text-slate-200">Enterprise University Template</span>
                    <span className="text-[10px] font-mono text-cyan-400 uppercase bg-cyan-950 px-2 py-0.5 rounded border border-cyan-500/30">
                      Recommended
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Seeds realistic multi-department schema, faculties, students, classrooms, active timetable, grievances, library catalog & security zones.
                  </p>
                </div>

                <div
                  onClick={() => setTemplate('EMPTY')}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    template === 'EMPTY'
                      ? 'bg-cyan-950/40 border-cyan-500/60 shadow-[0_0_15px_rgba(6,182,212,0.15)]'
                      : 'bg-[#0A101C] border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-bold text-slate-200">Absolute Empty Slate</span>
                    <span className="text-[10px] font-mono text-slate-400 uppercase bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                      Clean
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Zero starter records. Creates only the root institution metadata and the System Owner account for manual setup.
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
              <span className="text-xs text-slate-500 font-mono">
                Port 3000 • Sovereign Local File Persistence
              </span>
              <Button
                type="submit"
                variant="primary"
                size="lg"
                isLoading={isLoading}
                icon={ArrowRight}
                iconPosition="right"
              >
                Launch Campus Operating System
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
