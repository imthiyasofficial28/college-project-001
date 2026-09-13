import React, { useState, useEffect } from 'react';
import {
  Settings,
  ShieldAlert,
  Building2,
  Database,
  AlertOctagon,
  RotateCcw,
  Edit2,
  Save,
  X,
  CheckCircle2,
  Lock,
  ShieldCheck,
  Globe,
  Mail,
  Phone,
  Calendar,
  School,
  Sparkles,
  Cloud,
  CloudUpload,
  HardDrive,
  Share2,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';
import { useAuth } from '../../lib/auth-context.tsx';
import { useDrive } from '../../lib/drive-context.tsx';
import { GoogleDriveSyncModal } from '../drive/GoogleDriveSyncModal.tsx';
import { Button } from '../ui/button.tsx';
import { Input, Select, Textarea } from '../ui/input.tsx';
import { Badge } from '../ui/badge.tsx';
import { Modal } from '../ui/modal.tsx';

export const SettingsView: React.FC = () => {
  const { institution, liveTelemetry, resetInstitution, updateInstitutionProfile, activeRole, hasPermission, lastSavedAt, syncToLocalMemory, syncStatus } = useAuth();
  const {
    driveUser,
    isConnected: isDriveConnected,
    isSyncing: isDriveSyncing,
    driveBackups,
    lastDriveSyncAt,
    syncAllToDrive,
    hasScopeError,
  } = useDrive();

  const [isDriveVaultOpen, setIsDriveVaultOpen] = useState(false);
  const [driveQuickSyncSuccess, setDriveQuickSyncSuccess] = useState<string | null>(null);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [confirmWord, setConfirmWord] = useState('');
  const [isResetting, setIsResetting] = useState(false);

  // Institutional Entity Profile edit state
  const canEditInstitution =
    activeRole === 'SYSTEM_OWNER' ||
    activeRole === 'ADMINISTRATOR' ||
    hasPermission('SYSTEM_OWNER') ||
    hasPermission('CAMPUS_ADMIN');

  const [isEditingInst, setIsEditingInst] = useState(false);
  const [isSavingInst, setIsSavingInst] = useState(false);
  const [instSaveSuccess, setInstSaveSuccess] = useState<string | null>(null);
  const [instSaveError, setInstSaveError] = useState<string | null>(null);

  const [instForm, setInstForm] = useState({
    name: institution?.name || '',
    code: institution?.code || '',
    tagline: institution?.tagline || '',
    type: (institution?.type || 'UNIVERSITY') as string,
    address: institution?.address || '',
    contactEmail: institution?.contactEmail || '',
    contactPhone: institution?.contactPhone || '',
    website: institution?.website || '',
    establishedYear: institution?.establishedYear || new Date().getFullYear(),
    accreditation: institution?.accreditation || 'Accredited Sovereign Campus Institution',
    academicCalendarType: (institution?.academicCalendarType || 'SEMESTER') as 'SEMESTER' | 'TRIMESTER' | 'ANNUAL',
    timezone: institution?.timezone || 'UTC',
  });

  useEffect(() => {
    if (!isEditingInst && institution) {
      setInstForm({
        name: institution.name || '',
        code: institution.code || '',
        tagline: institution.tagline || '',
        type: (institution.type || 'UNIVERSITY') as string,
        address: institution.address || '',
        contactEmail: institution.contactEmail || '',
        contactPhone: institution.contactPhone || '',
        website: institution.website || '',
        establishedYear: institution.establishedYear || new Date().getFullYear(),
        accreditation: institution.accreditation || 'Accredited Sovereign Campus Institution',
        academicCalendarType: (institution.academicCalendarType || 'SEMESTER') as 'SEMESTER' | 'TRIMESTER' | 'ANNUAL',
        timezone: institution.timezone || 'UTC',
      });
    }
  }, [institution, isEditingInst]);

  const handleStartEdit = () => {
    if (!canEditInstitution) return;
    setInstSaveError(null);
    setInstSaveSuccess(null);
    if (institution) {
      setInstForm({
        name: institution.name || '',
        code: institution.code || '',
        tagline: institution.tagline || '',
        type: (institution.type || 'UNIVERSITY') as string,
        address: institution.address || '',
        contactEmail: institution.contactEmail || '',
        contactPhone: institution.contactPhone || '',
        website: institution.website || '',
        establishedYear: institution.establishedYear || new Date().getFullYear(),
        accreditation: institution.accreditation || 'Accredited Sovereign Campus Institution',
        academicCalendarType: (institution.academicCalendarType || 'SEMESTER') as 'SEMESTER' | 'TRIMESTER' | 'ANNUAL',
        timezone: institution.timezone || 'UTC',
      });
    }
    setIsEditingInst(true);
  };

  const handleCancelEdit = () => {
    setIsEditingInst(false);
    setInstSaveError(null);
  };

  const handleSaveInstitution = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!instForm.name.trim() || !instForm.code.trim()) {
      setInstSaveError('Institution Official Name and Code/Acronym are required.');
      return;
    }

    setIsSavingInst(true);
    setInstSaveError(null);
    try {
      await updateInstitutionProfile({
        name: instForm.name.trim(),
        code: instForm.code.trim().toUpperCase(),
        tagline: instForm.tagline.trim(),
        type: instForm.type as any,
        address: instForm.address.trim(),
        contactEmail: instForm.contactEmail.trim(),
        contactPhone: instForm.contactPhone.trim(),
        website: instForm.website.trim(),
        establishedYear: Number(instForm.establishedYear) || new Date().getFullYear(),
        accreditation: instForm.accreditation.trim(),
        academicCalendarType: instForm.academicCalendarType,
        timezone: instForm.timezone.trim(),
      });
      setIsEditingInst(false);
      setInstSaveSuccess('Institutional entity profile successfully updated and synchronized across all campus systems.');
      setTimeout(() => setInstSaveSuccess(null), 4000);
    } catch (err: any) {
      setInstSaveError(err.message || 'Failed to update institutional entity profile.');
    } finally {
      setIsSavingInst(false);
    }
  };

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

      {/* Institutional Entity Profile Card with Live Editing & Access Control */}
      <div className="p-5 sm:p-6 rounded-xl bg-[#0A101C] border border-slate-800 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-mono font-bold uppercase tracking-wider text-slate-100">
                  Institutional Entity Profile
                </h2>
                <Badge variant="info" size="sm">
                  {institution?.type || 'UNIVERSITY'}
                </Badge>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Official accreditation, naming, legal contact parameters, and academic calendar framework.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {canEditInstitution ? (
              <Badge variant="cyan" size="sm" className="font-mono text-[11px] gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                SOVEREIGN ACCESS
              </Badge>
            ) : (
              <Badge variant="outline" size="sm" className="font-mono text-[11px] text-amber-400 border-amber-500/40 gap-1">
                <Lock className="w-3.5 h-3.5" />
                RESTRICTED ACCESS
              </Badge>
            )}

            {!isEditingInst && canEditInstitution && (
              <Button
                variant="primary"
                size="sm"
                icon={Edit2}
                onClick={handleStartEdit}
                className="font-mono text-xs"
              >
                Edit Entity Profile
              </Button>
            )}
          </div>
        </div>

        {/* Success Alert */}
        {instSaveSuccess && (
          <div className="p-3.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2 animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>{instSaveSuccess}</span>
          </div>
        )}

        {/* Error Alert */}
        {instSaveError && (
          <div className="p-3.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2 animate-fadeIn">
            <AlertOctagon className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{instSaveError}</span>
          </div>
        )}

        {/* Access Warning for Unauthorized Roles */}
        {!canEditInstitution && (
          <div className="p-3.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs flex items-center gap-2">
            <Lock className="w-4 h-4 shrink-0 text-amber-400" />
            <span>
              You are currently viewing with <strong>{activeRole}</strong> credentials. Modifying institutional entity configurations requires <strong>System Owner</strong> or <strong>Campus Administrator</strong> privileges.
            </span>
          </div>
        )}

        {/* Form: Edit Mode */}
        {isEditingInst ? (
          <form onSubmit={handleSaveInstitution} className="space-y-6 pt-2">
            {/* Section 1: Identity & Classification */}
            <div className="space-y-3">
              <div className="text-[11px] font-mono font-semibold uppercase tracking-wider text-cyan-400 border-b border-slate-800/80 pb-1.5 flex items-center gap-1.5">
                <School className="w-3.5 h-3.5" />
                1. Institutional Identity & Designation
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <Input
                  label="Institution Full Name"
                  required
                  value={instForm.name}
                  onChange={(e) => setInstForm({ ...instForm, name: e.target.value })}
                  placeholder="e.g. Cambridge Global University"
                />
                <Input
                  label="Institution Code / Acronym"
                  required
                  value={instForm.code}
                  onChange={(e) => setInstForm({ ...instForm, code: e.target.value })}
                  placeholder="e.g. CGU"
                />
                <Select
                  label="Entity Classification"
                  value={instForm.type}
                  onChange={(e) => setInstForm({ ...instForm, type: e.target.value })}
                  options={[
                    { value: 'UNIVERSITY', label: 'Autonomous University' },
                    { value: 'COLLEGE', label: 'Degree College' },
                    { value: 'POLYTECHNIC', label: 'Polytechnic Institute' },
                    { value: 'RESEARCH_CAMPUS', label: 'Research Campus / Institute' },
                    { value: 'INSTITUTE', label: 'Specialized Institute' },
                    { value: 'SCHOOL', label: 'Collegiate School' },
                  ]}
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Sovereign Tagline / Motto"
                  value={instForm.tagline}
                  onChange={(e) => setInstForm({ ...instForm, tagline: e.target.value })}
                  placeholder="e.g. Knowledge, Sovereign Intellect & Humanity"
                />
                <Input
                  label="Accreditation Authority"
                  value={instForm.accreditation}
                  onChange={(e) => setInstForm({ ...instForm, accreditation: e.target.value })}
                  placeholder="e.g. Sovereign Higher Education Accreditation Council (SHEAC)"
                />
              </div>
            </div>

            {/* Section 2: Contact & Location */}
            <div className="space-y-3">
              <div className="text-[11px] font-mono font-semibold uppercase tracking-wider text-cyan-400 border-b border-slate-800/80 pb-1.5 flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5" />
                2. Contact Vectors & Physical Location
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Input
                  label="Official Administrative Email"
                  type="email"
                  value={instForm.contactEmail}
                  onChange={(e) => setInstForm({ ...instForm, contactEmail: e.target.value })}
                  placeholder="e.g. contact@cgu.edu"
                  icon={Mail}
                />
                <Input
                  label="Emergency & Operations Phone"
                  value={instForm.contactPhone}
                  onChange={(e) => setInstForm({ ...instForm, contactPhone: e.target.value })}
                  placeholder="e.g. +1 (555) 019-4820"
                  icon={Phone}
                />
                <Input
                  label="Official Web Portal URL"
                  value={instForm.website}
                  onChange={(e) => setInstForm({ ...instForm, website: e.target.value })}
                  placeholder="e.g. https://cgu.edu"
                  icon={Globe}
                />
              </div>
              <Input
                label="Physical Campus Command Address"
                value={instForm.address}
                onChange={(e) => setInstForm({ ...instForm, address: e.target.value })}
                placeholder="e.g. 742 Cambridge Innovation Corridor, Command Sector 4"
              />
            </div>

            {/* Section 3: Governance & Calendar System */}
            <div className="space-y-3">
              <div className="text-[11px] font-mono font-semibold uppercase tracking-wider text-cyan-400 border-b border-slate-800/80 pb-1.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                3. Governance Framework & Calendar Rhythm
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Input
                  label="Year Established"
                  type="number"
                  value={instForm.establishedYear}
                  onChange={(e) => setInstForm({ ...instForm, establishedYear: parseInt(e.target.value) || 2025 })}
                  placeholder="2025"
                />
                <Select
                  label="Academic Calendar Rhythm"
                  value={instForm.academicCalendarType}
                  onChange={(e) => setInstForm({ ...instForm, academicCalendarType: e.target.value as any })}
                  options={[
                    { value: 'SEMESTER', label: 'Semester (2 cycles / year)' },
                    { value: 'TRIMESTER', label: 'Trimester (3 cycles / year)' },
                    { value: 'ANNUAL', label: 'Annual (1 cycle / year)' },
                  ]}
                />
                <Input
                  label="Operational Timezone"
                  value={instForm.timezone}
                  onChange={(e) => setInstForm({ ...instForm, timezone: e.target.value })}
                  placeholder="e.g. UTC, UTC-5 (EST), UTC+5:30 (IST)"
                />
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
              <Button
                type="button"
                variant="outline"
                size="sm"
                icon={X}
                onClick={handleCancelEdit}
                disabled={isSavingInst}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                icon={Save}
                isLoading={isSavingInst}
              >
                Save Entity Profile Changes
              </Button>
            </div>
          </form>
        ) : (
          /* View Mode: Structured Presentation */
          <div className="space-y-4 pt-1">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs font-mono">
              <div className="p-3.5 rounded-lg bg-[#080D18] border border-slate-800/80">
                <span className="text-slate-500 uppercase text-[10px] tracking-wider block mb-1">
                  Institution Name:
                </span>
                <div className="text-slate-100 font-bold font-sans text-sm">{institution?.name || 'Not specified'}</div>
              </div>
              <div className="p-3.5 rounded-lg bg-[#080D18] border border-slate-800/80">
                <span className="text-slate-500 uppercase text-[10px] tracking-wider block mb-1">
                  Institution Code:
                </span>
                <div className="text-cyan-400 font-bold text-sm">{institution?.code || 'Not set'}</div>
              </div>
              <div className="p-3.5 rounded-lg bg-[#080D18] border border-slate-800/80">
                <span className="text-slate-500 uppercase text-[10px] tracking-wider block mb-1">
                  Established Year:
                </span>
                <div className="text-slate-200 font-bold text-sm">{institution?.establishedYear || '2025'}</div>
              </div>
              <div className="p-3.5 rounded-lg bg-[#080D18] border border-slate-800/80">
                <span className="text-slate-500 uppercase text-[10px] tracking-wider block mb-1">
                  Academic Calendar:
                </span>
                <div className="text-slate-200 font-bold text-sm">{institution?.academicCalendarType || 'SEMESTER'}</div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs font-mono">
              <div className="p-3.5 rounded-lg bg-[#080D18] border border-slate-800/80">
                <span className="text-slate-500 uppercase text-[10px] tracking-wider block mb-1 flex items-center gap-1.5">
                  <Mail className="w-3 h-3 text-cyan-400" />
                  Official Contact Email:
                </span>
                <div className="text-slate-200 font-sans text-xs break-all">
                  {institution?.contactEmail || 'Not configured'}
                </div>
              </div>
              <div className="p-3.5 rounded-lg bg-[#080D18] border border-slate-800/80">
                <span className="text-slate-500 uppercase text-[10px] tracking-wider block mb-1 flex items-center gap-1.5">
                  <Phone className="w-3 h-3 text-emerald-400" />
                  Operations & Emergency Phone:
                </span>
                <div className="text-slate-200 font-sans text-xs">
                  {institution?.contactPhone || 'Not configured'}
                </div>
              </div>
              <div className="p-3.5 rounded-lg bg-[#080D18] border border-slate-800/80">
                <span className="text-slate-500 uppercase text-[10px] tracking-wider block mb-1 flex items-center gap-1.5">
                  <Globe className="w-3 h-3 text-blue-400" />
                  Official Web Portal:
                </span>
                <div className="text-slate-200 font-sans text-xs truncate">
                  {institution?.website ? (
                    <a href={institution.website} target="_blank" rel="noreferrer" className="text-cyan-400 underline hover:text-cyan-300">
                      {institution.website}
                    </a>
                  ) : (
                    'Not configured'
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
              <div className="p-3.5 rounded-lg bg-[#080D18] border border-slate-800/80">
                <span className="text-slate-500 uppercase text-[10px] tracking-wider block mb-1">
                  Physical Campus Command Address:
                </span>
                <div className="text-slate-200 font-sans text-xs leading-relaxed">
                  {institution?.address || 'Not configured'}
                </div>
              </div>
              <div className="p-3.5 rounded-lg bg-[#080D18] border border-slate-800/80">
                <span className="text-slate-500 uppercase text-[10px] tracking-wider block mb-1">
                  Sovereign Motto & Tagline:
                </span>
                <div className="text-slate-300 italic font-serif text-xs leading-relaxed">
                  "{institution?.tagline || institution?.motto || 'Sovereign Campus Unified Operations System'}"
                </div>
              </div>
            </div>

            <div className="p-3.5 rounded-lg bg-[#080D18] border border-slate-800/80 text-xs font-mono flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="text-slate-500 uppercase text-[10px] tracking-wider block mb-0.5">
                  Accreditation & Registry Status:
                </span>
                <span className="text-slate-300 text-xs font-sans">
                  {institution?.accreditation || 'Autonomous Sovereign Campus OS'}
                </span>
              </div>
              <div className="text-slate-500 text-[11px]">
                Timezone: <span className="text-slate-300 font-mono">{institution?.timezone || 'UTC'}</span>
              </div>
            </div>
          </div>
        )}
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

      {/* Data Storage & Google Drive Cloud Synchronization */}
      <div className="p-5 sm:p-6 rounded-xl bg-[#0B1220] border border-slate-800 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Cloud className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-100">
                Data Persistence & Google Drive Cloud Vault
              </h3>
              <p className="text-xs text-slate-400">
                Continuous local memory caching paired with on-demand and scheduled Google Drive cloud backups.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isDriveConnected ? (
              <Badge variant="success" size="sm" className="font-mono text-[10px]">
                DRIVE CONNECTED
              </Badge>
            ) : hasScopeError ? (
              <Badge variant="warning" size="sm" className="font-mono text-[10px] text-amber-400 border-amber-500/40">
                PERMISSION REQUIRED
              </Badge>
            ) : (
              <Badge variant="outline" size="sm" className="font-mono text-[10px] text-slate-400">
                DRIVE OFFLINE
              </Badge>
            )}
            <Button
              variant="outline"
              size="sm"
              icon={Cloud}
              onClick={() => setIsDriveVaultOpen(true)}
              className="text-xs"
            >
              Open Cloud Vault
            </Button>
          </div>
        </div>

        {driveQuickSyncSuccess && (
          <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2 animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>{driveQuickSyncSuccess}</span>
          </div>
        )}

        {/* Dual Storage Comparison Matrix */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Local Memory Storage */}
          <div className="p-4 rounded-xl bg-[#080D18] border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-mono font-semibold text-cyan-400 uppercase tracking-wider">
                <HardDrive className="w-4 h-4" />
                Local Memory Storage
              </div>
              <Badge variant="cyan" size="sm" className="font-mono text-[10px]">
                REAL-TIME
              </Badge>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Every roster update, attendance swipe, exam result, and facility ticket is instantly written to local memory and persistent container storage for sub-second system execution.
            </p>
            <div className="pt-1 flex items-center justify-between text-[11px] font-mono border-t border-slate-800/80">
              <span className="text-slate-400">
                Last synced: {lastSavedAt ? lastSavedAt.toLocaleTimeString() : 'Current Session'}
              </span>
              <button
                onClick={syncToLocalMemory}
                disabled={syncStatus === 'saving'}
                className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-medium cursor-pointer"
              >
                <RefreshCw className={`w-3 h-3 ${syncStatus === 'saving' ? 'animate-spin' : ''}`} />
                <span>Save Memory</span>
              </button>
            </div>
          </div>

          {/* Google Drive Storage */}
          <div className="p-4 rounded-xl bg-[#080D18] border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-mono font-semibold text-emerald-400 uppercase tracking-wider">
                <Cloud className="w-4 h-4" />
                Google Drive Cloud Vault
              </div>
              <Badge variant="success" size="sm" className="font-mono text-[10px]">
                SOVEREIGN VAULT
              </Badge>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Packs all 35+ campus sub-modules into portable, immutable JSON snapshots stored in your Google Drive (<code className="text-emerald-300">CUOIS Campus Data Vault</code>) for effortless sharing and disaster recovery.
            </p>
            <div className="pt-1 flex items-center justify-between text-[11px] font-mono border-t border-slate-800/80">
              <span className="text-slate-400">
                {isDriveConnected
                  ? `${driveBackups.length} snapshot(s) in Drive`
                  : 'Not connected yet'}
              </span>
              {isDriveConnected ? (
                <button
                  onClick={async () => {
                    try {
                      const res = await syncAllToDrive('Settings quick snapshot');
                      setDriveQuickSyncSuccess(`Created snapshot: ${res.name}`);
                      setTimeout(() => setDriveQuickSyncSuccess(null), 4000);
                    } catch {
                      // handled in context
                    }
                  }}
                  disabled={isDriveSyncing}
                  className="text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-medium cursor-pointer"
                >
                  <CloudUpload className={`w-3 h-3 ${isDriveSyncing ? 'animate-pulse' : ''}`} />
                  <span>{isDriveSyncing ? 'Syncing...' : 'Sync to Drive'}</span>
                </button>
              ) : (
                <button
                  onClick={() => setIsDriveVaultOpen(true)}
                  className="text-emerald-400 hover:text-emerald-300 font-medium cursor-pointer"
                >
                  {hasScopeError ? 'Authorize Drive →' : 'Connect Drive →'}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Drive Account & Fast Vault Action */}
        <div className="p-3.5 rounded-lg bg-[#0E1726]/60 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 font-mono text-xs">
              {driveUser?.displayName ? driveUser.displayName[0] : 'G'}
            </div>
            <div>
              <span className="font-semibold text-slate-200">
                {driveUser ? driveUser.email : 'Google Account: Not Connected'}
              </span>
              <p className="text-[11px] text-slate-400">
                {driveUser
                  ? 'Access tokens are strictly cached in-memory and never exposed in browser storage.'
                  : 'Click "Open Cloud Vault" to authenticate via Google Sign-In and authorize Drive access.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="primary"
              size="sm"
              icon={CloudUpload}
              onClick={() => setIsDriveVaultOpen(true)}
              className="text-xs"
            >
              {isDriveConnected ? 'Manage Cloud Vault' : 'Connect & Sync Drive'}
            </Button>
          </div>
        </div>
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
            placeholder="Type RESET to proceed"
            className="font-mono text-center tracking-widest uppercase"
          />

          <div className="flex items-center justify-end gap-3 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setIsResetModalOpen(false);
                setConfirmWord('');
              }}
              disabled={isResetting}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              icon={RotateCcw}
              onClick={handleExecuteReset}
              isLoading={isResetting}
              disabled={confirmWord !== 'RESET'}
            >
              Confirm Purge
            </Button>
          </div>
        </div>
      </Modal>

      {/* Google Drive Synchronization Vault Modal */}
      <GoogleDriveSyncModal
        isOpen={isDriveVaultOpen}
        onClose={() => setIsDriveVaultOpen(false)}
      />
    </div>
  );
};
