import React, { useState, useRef } from 'react';
import {
  Shield,
  Lock,
  ArrowRight,
  User,
  AlertTriangle,
  Key,
  Eye,
  EyeOff,
  CheckCircle2,
  Cloud,
  CloudDownload,
  RefreshCw,
  ExternalLink,
  Upload,
  Globe,
  Copy,
  Check,
  HardDrive,
} from 'lucide-react';
import { useAuth } from '../../lib/auth-context.tsx';
import { useDrive } from '../../lib/drive-context.tsx';
import { getDriveAccessToken } from '../../lib/google-drive.ts';
import { Button } from '../ui/button.tsx';

export const LoginView: React.FC = () => {
  const { institution, login } = useAuth();
  const {
    isConnected,
    isConnecting,
    isSyncing,
    connectDrive,
    pullFromMasterDrive,
    driveUser,
    masterDriveFile,
    lastSyncSuccessMessage,
    syncError,
    hasUnauthorizedDomainError,
    currentHostname,
    restoreFromLocalFile,
    clearErrors,
  } = useDrive();

  // Compulsory Member ID and Password state
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cloudSuccess, setCloudSuccess] = useState<string | null>(null);
  const [copiedDomain, setCopiedDomain] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isRestoringFile, setIsRestoringFile] = useState(false);

  const handleRestoreFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsRestoringFile(true);
    setError(null);
    setCloudSuccess(null);
    try {
      await restoreFromLocalFile(file);
      setCloudSuccess(`Campus database loaded from "${file.name}"! You can now log in with your credentials.`);
    } catch (err: any) {
      setError('Failed to load backup: ' + (err.message || 'Invalid format'));
    } finally {
      setIsRestoringFile(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

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

  const handleDriveConnectAndPull = async () => {
    setCloudSuccess(null);
    setError(null);
    try {
      if (!getDriveAccessToken()) {
        await connectDrive();
      }
      if (!getDriveAccessToken()) {
        // User closed or dismissed the popup without signing in
        return;
      }
      await pullFromMasterDrive();
      setCloudSuccess('Master campus database successfully loaded from Google Drive! You can now log in.');
    } catch (err: any) {
      // syncError is already handled by useDrive
    }
  };

  return (
    <div className="min-h-screen bg-[#070B14] text-slate-100 flex flex-col justify-center items-center p-4 relative overflow-hidden">
      {/* Ambient background glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[650px] h-[360px] bg-cyan-500/10 rounded-full blur-[150px] pointer-events-none" />

      <div className="w-full max-w-lg z-10 space-y-4">
        {/* Campus Seal & Title */}
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500 via-blue-600 to-indigo-700 p-0.5 flex items-center justify-center mx-auto mb-2 shadow-[0_0_30px_rgba(6,182,212,0.35)]">
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

        {/* Cross-Device Google Drive Master Storage Access Card */}
        <div className="p-4 rounded-xl bg-gradient-to-r from-[#0C172B] via-[#0E1F3B] to-[#0C172B] border border-cyan-500/40 text-slate-300 text-xs shadow-xl space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-cyan-300 font-semibold">
              <Cloud className="w-4 h-4 text-cyan-400" />
              <span>Multi-Device Cloud Access (Google Drive)</span>
            </div>
            {isConnected ? (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                VAULT CONNECTED
              </span>
            ) : (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 font-bold">
                CROSS-DEVICE SYNC
              </span>
            )}
          </div>

          <p className="text-[11px] text-slate-400 leading-relaxed">
            Accessing from another device? Connect your Google Drive to automatically load the Master Campus Database saved by the System Owner.
          </p>

          {cloudSuccess && (
            <div className="p-2.5 rounded-lg bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{cloudSuccess}</span>
            </div>
          )}

          {/* Special Vercel Domain Alert */}
          {(hasUnauthorizedDomainError || (syncError && syncError.toLowerCase().includes('unauthorized-domain'))) ? (
            <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-amber-300 flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-amber-400" />
                  Firebase Domain Authorization Required
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300">
                  VERCEL
                </span>
              </div>
              <p className="text-[11px] text-slate-300">
                Firebase blocked Google sign-in because <strong className="text-amber-300">{currentHostname}</strong> is not in your Firebase Authorized Domains list.
              </p>
              <div className="flex items-center justify-between bg-slate-950/80 p-1.5 px-2.5 rounded border border-slate-800 text-[11px]">
                <code className="text-amber-300 font-mono">{currentHostname}</code>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(currentHostname);
                    setCopiedDomain(true);
                    setTimeout(() => setCopiedDomain(false), 2500);
                  }}
                  className="text-slate-400 hover:text-white flex items-center gap-1 font-mono text-[10px] cursor-pointer"
                >
                  {copiedDomain ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedDomain ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
              <div className="flex items-center gap-2 text-[11px] pt-0.5">
                <a
                  href="https://console.firebase.google.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-cyan-400 hover:underline font-medium"
                >
                  <ExternalLink className="w-3 h-3" />
                  <span>Add domain in Firebase Console &rarr; Auth &rarr; Settings</span>
                </a>
              </div>
            </div>
          ) : (
            syncError && (
              <div className="p-2.5 rounded-lg bg-rose-950/60 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{syncError}</span>
              </div>
            )
          )}

          <div className="pt-1 space-y-2">
            {!isConnected ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={handleDriveConnectAndPull}
                  disabled={isConnecting || isSyncing}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-slate-900 font-bold text-xs transition-colors shadow-md disabled:opacity-50 cursor-pointer"
                >
                  {isConnecting ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <CloudDownload className="w-3.5 h-3.5 text-slate-900" />
                  )}
                  <span>Connect Google Drive</span>
                </button>

                {/* Free Zero-Config Local Backup Upload */}
                <label className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-emerald-500/30 hover:border-emerald-500/50 font-bold text-xs transition-colors shadow-md cursor-pointer">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".json,application/json"
                    className="hidden"
                    onChange={handleRestoreFile}
                    disabled={isRestoringFile}
                  />
                  {isRestoringFile ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Upload className="w-3.5 h-3.5 text-emerald-400" />
                  )}
                  <span>Load Backup File (.json)</span>
                </label>
              </div>
            ) : (
              <div className="w-full flex items-center justify-between gap-2 bg-[#091122] p-2 rounded-lg border border-slate-700/60">
                <div className="text-[11px] text-slate-300 truncate">
                  <span className="text-slate-400">Drive Account: </span>
                  <span className="font-mono text-cyan-300">{driveUser?.email}</span>
                </div>
                <button
                  type="button"
                  onClick={handleDriveConnectAndPull}
                  disabled={isSyncing}
                  className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 text-[11px] font-medium transition-colors"
                >
                  <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} />
                  <span>{isSyncing ? 'Syncing...' : 'Pull Master from Drive'}</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Form Container */}
        <div className="bg-[#0E1524] border border-slate-800 rounded-2xl shadow-2xl p-5 sm:p-6">
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
        <div className="p-3.5 rounded-xl bg-[#090F1C] border border-cyan-500/30 text-center shadow-lg">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 text-[10px] font-mono mb-1 font-bold uppercase tracking-wider">
            <Shield className="w-3 h-3 text-cyan-400" />
            <span>Lead Architect & Sovereign Ownership</span>
          </div>
          <p className="text-xs font-semibold text-slate-100">
            Completely Developed & Architected by <span className="text-cyan-400 font-bold">Imthiyas</span>
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Sovereign System Owner: <span className="text-slate-200 font-medium">Imthiyas</span> • Support:{' '}
            <a
              href="mailto:imthiyasofficial28@gmail.com"
              className="text-cyan-400 underline hover:text-cyan-300"
            >
              imthiyasofficial28@gmail.com
            </a>
          </p>
        </div>

        {/* Security badge footer */}
        <div className="text-center flex items-center justify-center gap-2 text-[11px] text-slate-500 font-mono">
          <Key className="w-3.5 h-3.5 text-slate-500" />
          <span>PBKDF2 SHA-512 Cryptographic Auth • Multi-Device Google Drive Storage</span>
        </div>
      </div>
    </div>
  );
};
