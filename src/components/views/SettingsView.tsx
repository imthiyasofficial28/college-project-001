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
