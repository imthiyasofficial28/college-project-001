import React, { useState } from 'react';
import { Settings, ShieldAlert, Building2, Database, AlertOctagon, RotateCcw } from 'lucide-react';
import { useAuth } from '../../lib/auth-context.tsx';
import { Button } from '../ui/button.tsx';
import { Input } from '../ui/input.tsx';
import { Badge } from '../ui/badge.tsx';
import { Modal } from '../ui/modal.tsx';

export const SettingsView: React.FC = () => {
  const { institution, liveTelemetry, resetInstitution } = useAuth();
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [confirmWord, setConfirmWord] = useState('');
  const [isResetting, setIsResetting] = useState(false);

  const handleExecuteReset = async () => {
    if (confirmWord !== 'RESET') {
      alert('Type RESET to confirm');
      return;
    }
    setIsResetting(true);
    try {
      await resetInstitution();
    } catch (err: any) {
      alert(err.message || 'Failed to reset institution');
      setIsResetting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-serif font-bold text-slate-100 flex items-center gap-2">
          <Settings className="w-5 h-5 text-cyan-400" />
          Institution Sovereignty & System Settings
        </h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Platform identity, active environment telemetry, and root administrative reset controls.
        </p>
      </div>

      {/* Developer & Sovereign Ownership Credentials Card */}
      <div className="p-5 rounded-xl bg-gradient-to-br from-[#091122] via-[#0E1628] to-[#080D1A] border border-cyan-500/40 shadow-xl space-y-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-center justify-between pb-3 border-b border-slate-800 relative z-10">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
              <ShieldAlert className="w-4 h-4" />
            </span>
            <span className="text-xs font-mono font-semibold uppercase tracking-wider text-slate-200">
              Lead Software Architect & Sovereign Ownership Dossier
            </span>
          </div>
          <Badge variant="cyan" size="sm" className="font-bold font-mono">
            VERIFIED SOVEREIGN
          </Badge>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs relative z-10">
          <div className="p-3.5 rounded-lg bg-[#080D18] border border-cyan-500/20">
            <span className="text-slate-400 font-mono text-[11px] block mb-1 uppercase tracking-wider">
              System Developer:
            </span>
            <div className="text-base font-bold font-serif text-slate-100">Imthiyas</div>
            <p className="text-[11px] text-slate-400 mt-0.5">Full-stack platform engineer & architect</p>
          </div>
          <div className="p-3.5 rounded-lg bg-[#080D18] border border-cyan-500/20">
            <span className="text-slate-400 font-mono text-[11px] block mb-1 uppercase tracking-wider">
              Sovereign System Owner:
            </span>
            <div className="text-base font-bold font-serif text-cyan-400">Imthiyas</div>
            <p className="text-[11px] text-slate-400 mt-0.5">Root sovereign administrative authority</p>
          </div>
          <div className="p-3.5 rounded-lg bg-[#080D18] border border-cyan-500/20">
            <span className="text-slate-400 font-mono text-[11px] block mb-1 uppercase tracking-wider">
              Official Inquiries:
            </span>
            <a
              href="mailto:imthiyasofficial28@gmail.com"
              className="text-cyan-400 hover:text-cyan-300 underline font-mono text-xs block truncate"
            >
              imthiyasofficial28@gmail.com
            </a>
            <p className="text-[11px] text-slate-400 mt-0.5">Direct sovereign developer support</p>
          </div>
        </div>

        <div className="p-3 rounded-lg bg-[#060A14] border border-slate-800/80 text-[11px] text-slate-400 leading-relaxed relative z-10">
          <strong className="text-slate-200">Architectural Note:</strong> This Campus Unified Operations & Intelligence System (CUOIS) is completely developed by <strong className="text-slate-200">Imthiyas</strong> and owned by <strong className="text-cyan-400">Imthiyas</strong>. All system modules, including the physical Campus Digital Twin, are built with comprehensive CRUD sovereignty (Add, Modify, Remove, or Delete any node or record) without unrequested random mock datasets.
        </div>
      </div>

      {/* Institution Identity */}
      <div className="p-5 rounded-xl bg-[#0A101C] border border-slate-800 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-mono font-semibold uppercase tracking-wider text-slate-200">
              Institutional Entity Profile
            </span>
          </div>
          <Badge variant="info" size="sm">
            {institution?.type || 'UNIVERSITY'}
          </Badge>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="Institution Name" disabled value={institution?.name || ''} />
          <Input label="Institution Code" disabled value={institution?.code || ''} />
          <Input label="Physical Address" disabled value={institution?.address || ''} />
          <Input label="Emergency Contact Phone" disabled value={institution?.contactPhone || ''} />
        </div>
      </div>

      {/* Telemetry Architecture */}
      <div className="p-5 rounded-xl bg-[#0A101C] border border-slate-800 space-y-3">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
          <Database className="w-4 h-4 text-emerald-400" />
          <span className="text-xs font-mono font-semibold uppercase tracking-wider text-slate-200">
            Active System Telemetry
          </span>
        </div>

        {liveTelemetry && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono">
            <div className="p-3 rounded-lg bg-[#0E1524] border border-slate-800">
              <span className="text-slate-500">API Health:</span>
              <div className="text-emerald-400 font-bold mt-1">{liveTelemetry.apiStatus}</div>
            </div>
            <div className="p-3 rounded-lg bg-[#0E1524] border border-slate-800">
              <span className="text-slate-500">Realtime Bus:</span>
              <div className="text-cyan-400 font-bold mt-1">{liveTelemetry.realtimeEngineStatus}</div>
            </div>
            <div className="p-3 rounded-lg bg-[#0E1524] border border-slate-800">
              <span className="text-slate-500">Entities in DB:</span>
              <div className="text-slate-200 font-bold mt-1">{liveTelemetry.databaseEntitiesCount} records</div>
            </div>
            <div className="p-3 rounded-lg bg-[#0E1524] border border-slate-800">
              <span className="text-slate-500">RAM Heap:</span>
              <div className="text-slate-200 font-bold mt-1">{liveTelemetry.memoryUsageMb} MB</div>
            </div>
          </div>
        )}
      </div>

      {/* Danger Zone */}
      <div className="p-5 rounded-xl bg-rose-950/20 border border-rose-500/40 space-y-3">
        <div className="flex items-center gap-2 text-xs font-mono font-semibold uppercase tracking-wider text-rose-400">
          <AlertOctagon className="w-4 h-4 text-rose-400" />
          <span>Root Sovereign Danger Zone</span>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed max-w-2xl">
          Resetting the institution purges all campus data (Students, Timetables, Incidents, Grievances, Rosters) and returns the system to the initial unconfigured state. This action is irreversible.
        </p>
        <div className="pt-2">
          <Button
            variant="danger"
            size="sm"
            icon={RotateCcw}
            onClick={() => setIsResetModalOpen(true)}
          >
            Reset Institution to Empty State
          </Button>
        </div>
      </div>

      {/* Reset Confirmation Modal */}
      <Modal
        isOpen={isResetModalOpen}
        onClose={() => setIsResetModalOpen(false)}
        title="Confirm Institutional Reset"
        subtitle="Irreversible master purge of all records"
        maxWidth="sm"
      >
        <div className="space-y-4">
          <p className="text-xs text-rose-300 leading-relaxed">
            Please type <strong className="text-white font-mono">RESET</strong> below to confirm wiping the database back to empty setup.
          </p>

          <Input
            value={confirmWord}
            onChange={(e) => setConfirmWord(e.target.value)}
            placeholder="Type RESET"
          />

          <div className="pt-2 flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsResetModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              disabled={confirmWord !== 'RESET'}
              isLoading={isResetting}
              onClick={handleExecuteReset}
            >
              Confirm Purge
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
