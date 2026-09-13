import React, { useState } from 'react';
import {
  Cloud,
  CloudUpload,
  CloudDownload,
  HardDrive,
  RefreshCw,
  Share2,
  ExternalLink,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  Info,
  Copy,
  Check,
  RotateCcw,
  Clock,
  ShieldCheck,
  Database,
  Calendar,
  X,
  Sparkles,
  Zap,
  CheckCheck,
} from 'lucide-react';
import { useDrive } from '../../lib/drive-context.tsx';
import { useAuth } from '../../lib/auth-context.tsx';
import { DriveBackupFile, getDriveAccessToken } from '../../lib/google-drive.ts';
import { Modal } from '../ui/modal.tsx';
import { Button } from '../ui/button.tsx';
import { Badge } from '../ui/badge.tsx';
import { Input } from '../ui/input.tsx';

interface GoogleDriveSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GoogleDriveSyncModal: React.FC<GoogleDriveSyncModalProps> = ({ isOpen, onClose }) => {
  const { institution, lastSavedAt, activeRole } = useAuth();
  const {
    driveUser,
    isConnected,
    isConnecting,
    isSyncing,
    isAutoSyncing,
    autoSyncEnabled,
    isLoadingBackups,
    driveBackups,
    masterDriveFile,
    lastDriveSyncAt,
    lastSyncSuccessMessage,
    syncError,
    hasScopeError,
    connectDrive,
    disconnectDrive,
    syncAllToDrive,
    saveToMasterDrive,
    pullFromMasterDrive,
    toggleAutoSync,
    refreshBackups,
    restoreFromDrive,
    deleteFromDrive,
    reauthorizeDrive,
  } = useDrive();

  const [customNote, setCustomNote] = useState('');
  const [copiedFileId, setCopiedFileId] = useState<string | null>(null);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  // Destructive Confirmation States (MANDATORY per Workspace skill)
  const [confirmRestoreBackup, setConfirmRestoreBackup] = useState<DriveBackupFile | null>(null);
  const [isRestoring, setIsRestoring] = useState(false);
  const [confirmRestoreInput, setConfirmRestoreInput] = useState('');

  const [confirmDeleteBackup, setConfirmDeleteBackup] = useState<DriveBackupFile | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const isOwnerOrAdmin = activeRole === 'SYSTEM_OWNER' || activeRole === 'ADMINISTRATOR';

  const handleConnect = async () => {
    try {
      await connectDrive();
      if (getDriveAccessToken()) {
        setSuccessBanner('Successfully connected to Google Drive!');
        setTimeout(() => setSuccessBanner(null), 4000);
      }
    } catch {
      // handled in context
    }
  };

  const handleSyncNow = async () => {
    try {
      const file = await syncAllToDrive(customNote.trim() || undefined);
      setCustomNote('');
      setSuccessBanner(`Campus data successfully backed up to Google Drive: "${file.name}"`);
      setTimeout(() => setSuccessBanner(null), 5000);
    } catch {
      // handled in context
    }
  };

  const handleSaveMasterNow = async () => {
    try {
      await saveToMasterDrive('Manual update to Master Cloud Database');
      setSuccessBanner('Master campus database successfully updated in Google Drive!');
      setTimeout(() => setSuccessBanner(null), 5000);
    } catch {
      // handled in context
    }
  };

  const handlePullMasterNow = async () => {
    try {
      await pullFromMasterDrive();
      setSuccessBanner('Loaded Master campus database from Google Drive into this device!');
      setTimeout(() => setSuccessBanner(null), 5000);
    } catch {
      // handled in context
    }
  };

  const handleCopyLink = (file: DriveBackupFile) => {
    if (file.webViewLink) {
      navigator.clipboard.writeText(file.webViewLink);
      setCopiedFileId(file.id);
      setTimeout(() => setCopiedFileId(null), 2500);
    }
  };

  const handleConfirmRestore = async () => {
    if (!confirmRestoreBackup) return;
    setIsRestoring(true);
    try {
      await restoreFromDrive(confirmRestoreBackup);
      setConfirmRestoreBackup(null);
      setConfirmRestoreInput('');
      setSuccessBanner(`Restored campus state successfully from snapshot "${confirmRestoreBackup.name}".`);
      setTimeout(() => setSuccessBanner(null), 5000);
    } catch {
      // handled in context
    } finally {
      setIsRestoring(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!confirmDeleteBackup) return;
    setIsDeleting(true);
    try {
      await deleteFromDrive(confirmDeleteBackup.id);
      setConfirmDeleteBackup(null);
      setSuccessBanner('Backup file permanently removed from Google Drive.');
      setTimeout(() => setSuccessBanner(null), 4000);
    } catch {
      // handled in context
    } finally {
      setIsDeleting(false);
    }
  };

  const formatFileSize = (bytes?: string) => {
    if (!bytes) return 'N/A';
    const num = parseInt(bytes, 10);
    if (isNaN(num)) return 'N/A';
    if (num < 1024) return `${num} B`;
    if (num < 1024 * 1024) return `${(num / 1024).toFixed(1)} KB`;
    return `${(num / (1024 * 1024)).toFixed(2)} MB`;
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'Unknown';
    try {
      const d = new Date(dateStr);
      return d.toLocaleString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="Google Drive Cloud Vault & Synchronization"
        subtitle="Manage cloud backups, multi-device sync, and effortless sharing with stakeholders"
        size="2xl"
      >
        <div className="space-y-6">
          {/* Notification Messages */}
          {successBanner && (
            <div className="p-3.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2 animate-fadeIn">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              <span className="flex-1">{successBanner}</span>
            </div>
          )}

          {hasScopeError && (
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs space-y-2 animate-fadeIn">
              <div className="flex items-center gap-2 font-semibold">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Google Drive Permission Required</span>
              </div>
              <p className="text-slate-300">
                Your Google account was authorized with basic profile permissions. To list and upload institutional campus snapshots to Google Drive, please grant Google Drive file permissions.
              </p>
              <div className="pt-1">
                <button
                  onClick={handleConnect}
                  disabled={isConnecting}
                  className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-medium text-xs transition-colors cursor-pointer disabled:opacity-50"
                >
                  <Cloud className="w-3.5 h-3.5" />
                  <span>{isConnecting ? 'Authorizing...' : 'Authorize Google Drive Access'}</span>
                </button>
              </div>
            </div>
          )}

          {syncError && !hasScopeError && (
            <div className="p-3.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2 animate-fadeIn">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
              <span className="flex-1">{syncError}</span>
            </div>
          )}

          {/* Connection Status Card */}
          <div className="p-4 sm:p-5 rounded-xl bg-[#0B1220] border border-slate-800 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-500/15 to-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                  <Cloud className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-slate-100">
                      {isConnected ? driveUser?.displayName || 'Google Drive Connected' : hasScopeError ? 'Permission Required' : 'Google Drive Disconnected'}
                    </span>
                    {isConnected ? (
                      <Badge variant="success" size="sm" className="font-mono text-[10px]">
                        CONNECTED
                      </Badge>
                    ) : hasScopeError ? (
                      <Badge variant="warning" size="sm" className="font-mono text-[10px] text-amber-400 border-amber-500/40">
                        NEEDS PERMISSION
                      </Badge>
                    ) : (
                      <Badge variant="outline" size="sm" className="font-mono text-[10px] text-slate-400">
                        OFFLINE
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {isConnected
                      ? driveUser?.email || 'Authenticated and ready to sync'
                      : hasScopeError
                      ? 'Grant Google Drive permission to sync campus data.'
                      : 'Connect your Google account to enable cloud snapshots and effortless sharing.'}
                  </p>
                </div>
              </div>

              <div>
                {isConnected ? (
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={refreshBackups}
                      isLoading={isLoadingBackups}
                      icon={RefreshCw}
                      title="Refresh Drive Backups"
                    >
                      Refresh
                    </Button>
                    <Button variant="ghost" size="sm" onClick={disconnectDrive} className="text-rose-400 hover:text-rose-300">
                      Disconnect
                    </Button>
                  </div>
                ) : (
                  /* Official Google Sign In Button */
                  <button
                    onClick={handleConnect}
                    disabled={isConnecting}
                    className="inline-flex items-center gap-2.5 px-4 py-2.5 rounded-lg bg-white hover:bg-slate-100 text-slate-900 font-sans font-medium text-xs shadow-sm transition-all duration-150 disabled:opacity-50 cursor-pointer"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.35 24 12 24z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.35 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                      />
                    </svg>
                    <span>{isConnecting ? 'Signing in...' : 'Sign in with Google'}</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Educational Guide: How Local Storage vs. Drive Works */}
          <div className="p-4 rounded-xl bg-[#080D18] border border-slate-800/80 space-y-3">
            <div className="flex items-center gap-2 text-xs font-mono font-semibold uppercase tracking-wider text-cyan-400">
              <Info className="w-4 h-4" />
              How Storage & Synchronization Works
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-lg bg-[#0E1726]/60 border border-slate-800/60 space-y-1.5">
                <div className="flex items-center gap-1.5 font-semibold text-slate-200">
                  <HardDrive className="w-4 h-4 text-cyan-400" />
                  Local Memory Storage (Real-time)
                </div>
                <p className="text-slate-400 text-[11px] leading-relaxed">
                  Operates directly on the host server & local memory. Provides zero-latency reads and writes for live
                  attendance, gate monitoring, real-time timetable changes, and instant UI state updates.
                </p>
                <div className="text-[10px] font-mono text-slate-500 pt-1">
                  Last saved locally: {lastSavedAt ? lastSavedAt.toLocaleTimeString() : 'Active session'}
                </div>
              </div>

              <div className="p-3 rounded-lg bg-[#0E1726]/60 border border-slate-800/60 space-y-1.5">
                <div className="flex items-center gap-1.5 font-semibold text-slate-200">
                  <Cloud className="w-4 h-4 text-emerald-400" />
                  Google Drive Cloud Vault (Backup & Share)
                </div>
                <p className="text-slate-400 text-[11px] leading-relaxed">
                  Stores encrypted, immutable JSON snapshots of the entire campus database in your personal Google Drive
                  folder (<code className="text-cyan-300">CUOIS Campus Data Vault</code>). Easy to share with deans, download, or restore anytime.
                </p>
                <div className="text-[10px] font-mono text-slate-500 pt-1">
                  Last Drive snapshot: {lastDriveSyncAt ? lastDriveSyncAt.toLocaleString() : 'Not synced yet'}
                </div>
              </div>
            </div>
          </div>

          {/* Auto-Sync & Real-Time Cloud Mirroring Card */}
          {isConnected && (
            <div className="p-4 sm:p-5 rounded-xl bg-gradient-to-r from-[#0A1424] via-[#0E1D36] to-[#0A1424] border border-cyan-500/40 space-y-3 shadow-lg">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-xs font-mono font-semibold uppercase tracking-wider text-cyan-300">
                  <Zap className="w-4 h-4 text-amber-400" />
                  Continuous Auto-Sync to Google Drive
                </div>
                <div className="flex items-center gap-2">
                  {isAutoSyncing && (
                    <span className="text-[11px] text-amber-300 font-mono flex items-center gap-1">
                      <RefreshCw className="w-3 h-3 animate-spin text-amber-400" />
                      Auto-syncing...
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => toggleAutoSync(!autoSyncEnabled)}
                    className={`px-3 py-1 rounded-full text-[11px] font-mono font-bold transition-all border ${
                      autoSyncEnabled
                        ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300 shadow-sm'
                        : 'bg-slate-800 border-slate-700 text-slate-400'
                    }`}
                  >
                    {autoSyncEnabled ? '● AUTO-SYNC ACTIVE' : '○ MANUAL ONLY'}
                  </button>
                </div>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                When active, every change made by the System Owner (students, faculty, attendance, courses, grades, or settings) is <strong>automatically debounced and uploaded to Google Drive</strong>. Access this webpage from any laptop, tablet, or phone, sign into Google Drive, and your data is instantly accessible.
              </p>

              {lastSyncSuccessMessage && (
                <div className="p-2 rounded-lg bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 text-xs font-mono flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>{lastSyncSuccessMessage}</span>
                </div>
              )}
            </div>
          )}

          {/* Master Multi-Device Cloud Database Card */}
          {isConnected && (
            <div className="p-4 sm:p-5 rounded-xl bg-[#0B1220] border border-cyan-500/30 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2 text-xs font-mono font-semibold uppercase tracking-wider text-slate-200">
                    <Cloud className="w-4 h-4 text-cyan-400" />
                    Multi-Device Master Database
                  </div>
                  <p className="text-[11px] font-mono text-cyan-400 mt-0.5">
                    File: cuois_master_campus_database.json
                  </p>
                </div>
                {masterDriveFile ? (
                  <Badge variant="success" size="sm" className="font-mono text-[10px] shrink-0">
                    SYNC READY
                  </Badge>
                ) : (
                  <Badge variant="outline" size="sm" className="font-mono text-[10px] text-slate-400 shrink-0">
                    NO MASTER CREATED YET
                  </Badge>
                )}
              </div>

              <p className="text-xs text-slate-400">
                This master file is the single cloud source of truth. Click <strong>"Pull into This Device"</strong> on any device to instantly load all students, faculty, schedules, and operations saved by the System Owner.
              </p>

              {masterDriveFile && (
                <div className="p-2.5 rounded-lg bg-[#070D18] border border-slate-800 text-[11px] font-mono text-slate-400 flex flex-wrap items-center justify-between gap-2">
                  <span>Last Cloud Update: <strong className="text-slate-200">{formatDate(masterDriveFile.modifiedTime)}</strong></span>
                  <span>Size: <strong className="text-slate-200">{formatFileSize(masterDriveFile.size)}</strong></span>
                </div>
              )}

              <div className="flex flex-wrap gap-2 pt-1">
                <Button
                  variant="primary"
                  size="sm"
                  icon={CloudDownload}
                  onClick={handlePullMasterNow}
                  isLoading={isSyncing}
                  className="text-xs"
                >
                  Pull & Load on This Device
                </Button>
                {isOwnerOrAdmin && (
                  <Button
                    variant="outline"
                    size="sm"
                    icon={CloudUpload}
                    onClick={handleSaveMasterNow}
                    isLoading={isSyncing}
                    className="text-xs text-cyan-300 border-cyan-500/40 hover:bg-cyan-500/10"
                  >
                    Save Local State to Master
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Sync Trigger Section */}
          {isConnected && (
            <div className="p-4 sm:p-5 rounded-xl bg-[#0B1220] border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-mono font-semibold uppercase tracking-wider text-slate-200">
                  <CloudUpload className="w-4 h-4 text-emerald-400" />
                  Push Full Institutional Snapshot to Drive
                </div>
                <Badge variant="cyan" size="sm" className="font-mono text-[10px]">
                  ALL 35+ MODULES
                </Badge>
              </div>

              <p className="text-xs text-slate-400">
                Exports all departments, students, faculty profiles, rooms, timetables, examinations, grades, gate records, and settings into an organized snapshot.
              </p>

              <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
                <Input
                  placeholder="Optional snapshot note (e.g., 'Pre-Semester Finalized Roster')"
                  value={customNote}
                  onChange={(e) => setCustomNote(e.target.value)}
                  className="text-xs"
                />
                <Button
                  variant="primary"
                  size="sm"
                  icon={CloudUpload}
                  onClick={handleSyncNow}
                  isLoading={isSyncing}
                  disabled={!isOwnerOrAdmin}
                  className="shrink-0"
                >
                  Sync to Drive Now
                </Button>
              </div>
              {!isOwnerOrAdmin && (
                <p className="text-[11px] text-amber-400/90 font-mono">
                  * Creating and restoring institutional cloud backups requires Administrator or System Owner role.
                </p>
              )}
            </div>
          )}

          {/* Backups List Section */}
          {isConnected && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-mono font-semibold uppercase tracking-wider text-slate-300">
                  <Database className="w-4 h-4 text-cyan-400" />
                  Snapshots in Google Drive ({driveBackups.length})
                </div>
                <span className="text-[11px] text-slate-500 font-mono">
                  Folder: CUOIS Campus Data Vault
                </span>
              </div>

              {isLoadingBackups ? (
                <div className="p-8 text-center border border-slate-800 rounded-xl bg-[#0B1220] text-slate-400 text-xs flex items-center justify-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin text-cyan-400" />
                  Loading backups from Google Drive...
                </div>
              ) : driveBackups.length === 0 ? (
                <div className="p-8 text-center border border-dashed border-slate-800 rounded-xl bg-[#0B1220]/60 space-y-2">
                  <Cloud className="w-8 h-8 mx-auto text-slate-600" />
                  <p className="text-xs text-slate-400">No backups in Google Drive yet.</p>
                  <p className="text-[11px] text-slate-500">
                    Click "Sync to Drive Now" above to generate your first verified cloud snapshot.
                  </p>
                </div>
              ) : (
                <div className="max-h-64 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                  {driveBackups.map((file) => (
                    <div
                      key={file.id}
                      className="p-3.5 rounded-xl bg-[#0B1220] border border-slate-800 hover:border-slate-700 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                    >
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-semibold text-slate-100 truncate block">
                            {file.name}
                          </span>
                          <Badge variant="outline" size="sm" className="font-mono text-[10px] text-slate-400">
                            {formatFileSize(file.size)}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-3 text-[11px] text-slate-400 font-mono">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-slate-500" />
                            {formatDate(file.createdTime)}
                          </span>
                          {file.description && (
                            <span className="text-slate-400 truncate max-w-xs font-sans">
                              {file.description}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-auto">
                        {/* Open in Google Drive */}
                        {file.webViewLink && (
                          <a
                            href={file.webViewLink}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                            title="Open file in Google Drive"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        )}

                        {/* Copy Shareable Link */}
                        {file.webViewLink && (
                          <button
                            onClick={() => handleCopyLink(file)}
                            className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
                            title="Copy Shareable Link"
                          >
                            {copiedFileId === file.id ? (
                              <Check className="w-4 h-4 text-emerald-400" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </button>
                        )}

                        {/* Restore Snapshot (Admin/Owner only) */}
                        {isOwnerOrAdmin && (
                          <Button
                            variant="outline"
                            size="sm"
                            icon={RotateCcw}
                            onClick={() => {
                              setConfirmRestoreBackup(file);
                              setConfirmRestoreInput('');
                            }}
                            className="text-amber-400 hover:text-amber-300 text-[11px] h-7 px-2.5"
                          >
                            Restore
                          </Button>
                        )}

                        {/* Delete Backup (Admin/Owner only) */}
                        {isOwnerOrAdmin && (
                          <button
                            onClick={() => setConfirmDeleteBackup(file)}
                            className="p-1.5 rounded-lg bg-slate-800/40 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
                            title="Delete snapshot from Drive"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Modal Close Action */}
          <div className="flex items-center justify-end pt-3 border-t border-slate-800">
            <Button variant="outline" size="sm" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </Modal>

      {/* MANDATORY EXPLICIT CONFIRMATION DIALOG FOR RESTORE (Destructive Operation) */}
      {confirmRestoreBackup && (
        <Modal
          isOpen={true}
          onClose={() => {
            if (!isRestoring) {
              setConfirmRestoreBackup(null);
              setConfirmRestoreInput('');
            }
          }}
          title="Confirm Database Restoration"
          subtitle="Replacing active campus memory with selected Google Drive snapshot"
          size="md"
        >
          <div className="space-y-4 text-xs">
            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 space-y-2">
              <div className="flex items-center gap-2 font-semibold">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Destructive Operation Warning</span>
              </div>
              <p className="text-[11px] text-amber-200/90 leading-relaxed">
                Restoring will overwrite current campus records with the snapshot from{' '}
                <strong>{confirmRestoreBackup.name}</strong> ({formatDate(confirmRestoreBackup.createdTime)}).
              </p>
            </div>

            <div className="p-3 rounded-lg bg-[#0B1220] border border-slate-800 font-mono text-[11px] space-y-1">
              <div>Selected File: <span className="text-cyan-400">{confirmRestoreBackup.name}</span></div>
              <div>File Size: <span className="text-slate-300">{formatFileSize(confirmRestoreBackup.size)}</span></div>
              <div>Drive File ID: <span className="text-slate-400">{confirmRestoreBackup.id}</span></div>
            </div>

            <p className="text-slate-400 text-xs">
              To confirm restoration, please type <strong>RESTORE</strong> below:
            </p>

            <Input
              value={confirmRestoreInput}
              onChange={(e) => setConfirmRestoreInput(e.target.value)}
              placeholder="Type RESTORE to confirm"
              className="font-mono text-center tracking-widest uppercase"
            />

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setConfirmRestoreBackup(null);
                  setConfirmRestoreInput('');
                }}
                disabled={isRestoring}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                size="sm"
                icon={RotateCcw}
                onClick={handleConfirmRestore}
                isLoading={isRestoring}
                disabled={confirmRestoreInput !== 'RESTORE'}
              >
                Confirm Restore
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* MANDATORY EXPLICIT CONFIRMATION DIALOG FOR DELETE */}
      {confirmDeleteBackup && (
        <Modal
          isOpen={true}
          onClose={() => {
            if (!isDeleting) setConfirmDeleteBackup(null);
          }}
          title="Delete Backup from Google Drive"
          subtitle="Permanently remove snapshot from your Google Drive vault"
          size="md"
        >
          <div className="space-y-4 text-xs">
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 space-y-2">
              <div className="flex items-center gap-2 font-semibold">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>Permanent File Deletion</span>
              </div>
              <p className="text-[11px] text-rose-200/90 leading-relaxed">
                Are you sure you want to permanently delete <strong>{confirmDeleteBackup.name}</strong> from your Google Drive? This action cannot be undone.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setConfirmDeleteBackup(null)}
                disabled={isDeleting}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                size="sm"
                icon={Trash2}
                onClick={handleConfirmDelete}
                isLoading={isDeleting}
              >
                Delete File
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
};
