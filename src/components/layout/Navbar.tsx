import React, { useState, useEffect } from 'react';
import {
  Bell,
  Search,
  Shield,
  Activity,
  LogOut,
  ChevronDown,
  CheckCheck,
  Cpu,
  RefreshCw,
  UserCheck,
  Radio,
  Sparkles,
  HardDrive,
  CheckCircle2,
  Database,
  CloudCheck,
  Cloud,
  User,
  Edit3,
  X,
} from 'lucide-react';
import { useAuth } from '../../lib/auth-context.tsx';
import { useDrive } from '../../lib/drive-context.tsx';
import { GoogleDriveSyncModal } from '../drive/GoogleDriveSyncModal.tsx';
import { UserRole } from '../../types/index.ts';
import { Badge } from '../ui/badge.tsx';

function formatLastSaved(date: Date | null, now: number): { short: string; detailed: string; exactTime: string } {
  if (!date) {
    return {
      short: 'Saved',
      detailed: 'Synchronized with local memory',
      exactTime: 'Active session',
    };
  }
  const diffSec = Math.max(0, Math.floor((now - date.getTime()) / 1000));
  let relativeText = 'Just now';
  if (diffSec < 10) {
    relativeText = 'Just now';
  } else if (diffSec < 60) {
    relativeText = `${diffSec}s ago`;
  } else if (diffSec < 3600) {
    const mins = Math.floor(diffSec / 60);
    relativeText = `${mins}m ago`;
  } else {
    relativeText = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  return {
    short: `Saved ${relativeText}`,
    detailed: `Persisted to local memory (${relativeText})`,
    exactTime: timeStr,
  };
}

interface NavbarProps {
  onOpenCommandPalette: () => void;
  onNavigate?: (view: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenCommandPalette, onNavigate }) => {
  const {
    user,
    institution,
    activeRole,
    notifications,
    unreadNotifsCount,
    liveTelemetry,
    lastSavedAt,
    syncStatus,
    syncToLocalMemory,
    logout,
    switchPerspective,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    refreshState,
    updateUserName,
  } = useAuth();

  const { isConnected: isDriveConnected, isSyncing: isDriveSyncing, driveBackups, hasScopeError } = useDrive();
  const [isDriveModalOpen, setIsDriveModalOpen] = useState(false);

  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const [showSyncDetails, setShowSyncDetails] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [currentTime, setCurrentTime] = useState(Date.now());
  const [showNameModal, setShowNameModal] = useState(false);
  const [showOwnershipDossier, setShowOwnershipDossier] = useState(false);
  const [editNameInput, setEditNameInput] = useState('');
  const [isSavingName, setIsSavingName] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(Date.now()), 5000);
    return () => clearInterval(timer);
  }, []);

  const availableRoles: { role: UserRole; label: string; desc: string }[] = [
    { role: 'SYSTEM_OWNER', label: 'System Owner', desc: 'Full institutional sovereignty & root config' },
    { role: 'ADMINISTRATOR', label: 'Administrator', desc: 'Departmental management & user operations' },
    { role: 'EDITOR', label: 'Editor / Content Publisher', desc: 'Manage departments, library, announcements & catalogs' },
    { role: 'MANAGEMENT', label: 'Executive Management', desc: 'Campus analytics, policy & oversight' },
    { role: 'FACULTY', label: 'Faculty / Professor', desc: 'Course rosters, grading & attendance' },
    { role: 'STUDENT', label: 'Student', desc: 'Timetables, attendance, grades & grievances' },
    { role: 'SECURITY', label: 'Security Officer', desc: 'Perimeter monitoring, gates & incidents' },
    { role: 'STAFF', label: 'Facilities Staff', desc: 'Work orders, maintenance & venues' },
  ];

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshState();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  return (
    <header className="h-16 bg-[#0A0F1D] border-b border-slate-800/80 px-4 md:px-6 flex items-center justify-between z-30 sticky top-0">
      {/* Brand & Campus Status */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 p-0.5 flex items-center justify-center shadow-[0_0_15px_rgba(6,182,212,0.3)]">
            <div className="w-full h-full bg-[#0A0F1D] rounded-[10px] flex items-center justify-center font-serif text-cyan-400 font-bold text-sm">
              C
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-serif font-bold text-slate-100 tracking-wider text-sm">CUOIS</span>
              <Badge variant="info" size="sm" dot>
                OS 3.8
              </Badge>
            </div>
            <p className="text-[11px] text-slate-400 truncate max-w-[200px] md:max-w-xs font-mono">
              {institution?.name || 'Campus Unified OS'}
            </p>
          </div>
        </div>

        {/* Global Search / Command Bar Trigger */}
        <button
          onClick={onOpenCommandPalette}
          className="hidden md:flex items-center gap-3 px-3 py-1.5 rounded-lg bg-[#0E1524] border border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700 transition-colors text-xs font-mono"
        >
          <Search className="w-3.5 h-3.5 text-cyan-400" />
          <span>Quick Command / Jump...</span>
          <kbd className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700 text-[10px] text-slate-400">
            ⌘K
          </kbd>
        </button>

        {/* Developer & Sovereign Ownership Pill */}
        <button
          onClick={() => setShowOwnershipDossier(true)}
          title="Click to view Developer & Sovereign Ownership Dossier"
          className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gradient-to-r from-cyan-950/60 to-blue-950/60 border border-cyan-500/40 hover:border-cyan-400 text-cyan-300 transition-all text-xs font-mono shadow-[0_0_15px_rgba(6,182,212,0.15)] group"
        >
          <Sparkles className="w-3.5 h-3.5 text-cyan-400 group-hover:rotate-12 transition-transform shrink-0" />
          <span className="text-slate-200">
            Developed & Owned by <strong className="text-cyan-400 font-bold">Imthiyas</strong>
          </span>
          <span className="px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 text-[9px] font-bold uppercase border border-cyan-500/30">
            Verified
          </span>
        </button>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-2 md:gap-3">
        {/* Real-time Telemetry Pill */}
        {liveTelemetry && (
          <div className="hidden xl:flex items-center gap-2 px-2.5 py-1 rounded-full bg-[#0E1524] border border-slate-800 text-[11px] font-mono text-slate-300">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>LIVE</span>
            <span className="text-slate-600">|</span>
            <span className="text-cyan-400">{liveTelemetry.activeUsersCount} active</span>
            <span className="text-slate-600">|</span>
            <span className="text-slate-400">{liveTelemetry.uptimeSeconds}s up</span>
          </div>
        )}

        {/* 'Last saved' timestamp indicator */}
        <div className="relative">
          <button
            onClick={() => setShowSyncDetails(!showSyncDetails)}
            title="Local memory persistence status — click for details"
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-mono transition-all duration-150 ${
              syncStatus === 'saving'
                ? 'bg-amber-950/40 border-amber-500/40 text-amber-300'
                : 'bg-[#0E1524] hover:bg-[#131C30] border-slate-800 hover:border-slate-700 text-slate-300'
            }`}
          >
            {syncStatus === 'saving' ? (
              <>
                <RefreshCw className="w-3 h-3 text-amber-400 animate-spin" />
                <span className="font-medium">Saving...</span>
              </>
            ) : (
              <>
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-30"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
                </span>
                <HardDrive className="w-3 h-3 text-cyan-400" />
                <span className="hidden sm:inline text-slate-300 hover:text-slate-100">
                  {formatLastSaved(lastSavedAt, currentTime).short}
                </span>
                <span className="sm:hidden text-slate-300">Saved</span>
              </>
            )}
          </button>

          {showSyncDetails && (
            <div className="absolute right-0 mt-2 w-72 sm:w-80 bg-[#0E1524] border border-slate-700/80 rounded-xl shadow-2xl p-3.5 z-50 animate-in fade-in zoom-in-95">
              <div className="flex items-center justify-between pb-2.5 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-slate-100">Local Memory Persistence</h4>
                    <p className="text-[10px] text-emerald-400 font-mono">Status: Synchronized & Verified</p>
                  </div>
                </div>
                <Badge variant="success" size="sm">
                  Synced
                </Badge>
              </div>

              <div className="py-2.5 space-y-2 text-xs">
                <div className="flex items-center justify-between text-slate-400 text-[11px]">
                  <span>Last saved timestamp:</span>
                  <span className="font-mono text-slate-200">
                    {formatLastSaved(lastSavedAt, currentTime).exactTime}
                  </span>
                </div>
                <div className="flex items-center justify-between text-slate-400 text-[11px]">
                  <span>Persistence target:</span>
                  <span className="font-mono text-cyan-400">Browser Cache + Host DB</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed bg-[#080D17] p-2 rounded-lg border border-slate-800">
                  Active edits, user attendance, rosters, and administrative operations are continuously retained in local memory with real-time replication.
                </p>
              </div>

              <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                <span className="text-[10px] text-slate-500 font-mono">Zero data loss safeguard</span>
                <button
                  onClick={async (e) => {
                    e.stopPropagation();
                    await syncToLocalMemory();
                  }}
                  disabled={syncStatus === 'saving'}
                  className="px-2.5 py-1 rounded-lg bg-cyan-950/60 hover:bg-cyan-900/60 border border-cyan-500/30 text-cyan-300 text-xs font-mono font-medium flex items-center gap-1.5 transition-colors disabled:opacity-50"
                >
                  <RefreshCw className={`w-3 h-3 ${syncStatus === 'saving' ? 'animate-spin' : ''}`} />
                  <span>Sync Now</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Google Drive Cloud Vault Trigger */}
        <button
          onClick={() => setIsDriveModalOpen(true)}
          title={
            hasScopeError
              ? 'Google Drive permission required — Click to authorize'
              : isDriveConnected
              ? `Google Drive Connected — ${driveBackups.length} snapshot(s) in vault`
              : 'Connect Google Drive for cloud backup, multi-device sync & sharing'
          }
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-mono transition-all duration-150 ${
            hasScopeError
              ? 'bg-amber-950/40 hover:bg-amber-950/60 border-amber-500/50 text-amber-300'
              : isDriveSyncing
              ? 'bg-cyan-950/40 border-cyan-500/40 text-cyan-300'
              : isDriveConnected
              ? 'bg-emerald-950/30 hover:bg-emerald-950/50 border-emerald-500/30 text-emerald-300'
              : 'bg-[#0E1524] hover:bg-[#131C30] border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-200'
          }`}
        >
          <Cloud
            className={`w-3 h-3 ${
              hasScopeError
                ? 'text-amber-400'
                : isDriveSyncing
                ? 'animate-pulse text-cyan-400'
                : isDriveConnected
                ? 'text-emerald-400'
                : 'text-slate-400'
            }`}
          />
          <span className="hidden md:inline">
            {hasScopeError
              ? 'Drive Permission Needed'
              : isDriveSyncing
              ? 'Syncing Drive...'
              : isDriveConnected
              ? 'Drive Synced'
              : 'Google Drive'}
          </span>
          {isDriveConnected && driveBackups.length > 0 && (
            <span className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] flex items-center justify-center font-bold">
              {driveBackups.length}
            </span>
          )}
        </button>

        {/* Gemini Live & Chat Quick Trigger */}
        <button
          onClick={() => onNavigate?.('ai-command')}
          title="Open Gemini AI Intelligence, Chat & Live Voice"
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-violet-600/20 hover:bg-violet-600/30 border border-violet-500/40 text-violet-300 text-xs font-mono font-medium transition-colors"
        >
          <Radio className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
          <span className="hidden sm:inline">Gemini Live & Chat</span>
        </button>

        {/* Manual Refresh button */}
        <button
          onClick={handleRefresh}
          title="Refresh campus telemetry"
          className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-cyan-400' : ''}`} />
        </button>

        {/* Role Perspective Switcher */}
        <div className="relative">
          <button
            onClick={() => setShowRoleMenu(!showRoleMenu)}
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-[#0E1524] hover:bg-[#131C30] border border-slate-700/60 text-slate-200 text-xs font-medium transition-colors"
          >
            <Shield className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline font-mono">{activeRole.replace('_', ' ')}</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {showRoleMenu && (
            <div className="absolute right-0 mt-2 w-72 bg-[#0E1524] border border-slate-700/80 rounded-xl shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95">
              <div className="px-3 py-2 border-b border-slate-800">
                <p className="text-xs font-semibold text-slate-200">Switch Perspective</p>
                <p className="text-[10px] text-slate-400">
                  Instant RBAC context test matrix.
                </p>
              </div>
              <div className="py-1 max-h-64 overflow-y-auto space-y-1">
                {availableRoles.map((r) => (
                  <button
                    key={r.role}
                    onClick={async () => {
                      await switchPerspective(r.role);
                      setShowRoleMenu(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-colors flex items-start gap-2.5 ${
                      activeRole === r.role
                        ? 'bg-cyan-950/60 text-cyan-300 border border-cyan-500/30 font-medium'
                        : 'text-slate-300 hover:bg-slate-800/60'
                    }`}
                  >
                    <UserCheck className="w-3.5 h-3.5 mt-0.5 shrink-0 text-cyan-400" />
                    <div>
                      <div className="font-semibold">{r.label}</div>
                      <div className="text-[10px] text-slate-400">{r.desc}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setShowNotifMenu(!showNotifMenu)}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 transition-colors relative"
          >
            <Bell className="w-4 h-4" />
            {unreadNotifsCount > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-[#0A0F1D]" />
            )}
          </button>

          {showNotifMenu && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-[#0E1524] border border-slate-700/80 rounded-xl shadow-2xl p-2 z-50">
              <div className="flex items-center justify-between px-3 py-2 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-200">Campus Alerts</span>
                  {unreadNotifsCount > 0 && (
                    <Badge variant="danger" size="sm">
                      {unreadNotifsCount} New
                    </Badge>
                  )}
                </div>
                {unreadNotifsCount > 0 && (
                  <button
                    onClick={() => markAllNotificationsAsRead()}
                    className="text-[10px] font-mono text-cyan-400 hover:underline flex items-center gap-1"
                  >
                    <CheckCheck className="w-3 h-3" /> Mark read
                  </button>
                )}
              </div>

              <div className="max-h-72 overflow-y-auto divide-y divide-slate-800/50 py-1">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-500 font-mono">
                    No active campus notifications.
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => markNotificationAsRead(n.id)}
                      className={`p-3 text-xs cursor-pointer hover:bg-slate-800/40 transition-colors ${
                        !n.isRead ? 'bg-cyan-950/20' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="font-semibold text-slate-200 truncate">{n.title}</span>
                        <span className="text-[10px] font-mono text-slate-500 shrink-0">
                          {new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-slate-400 text-[11px] leading-relaxed line-clamp-2">{n.message}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Profile & Logout */}
        <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
          <button
            onClick={() => onNavigate?.('profile')}
            title="Maintain your personal profile, credentials and password"
            className="flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-slate-800/60 transition-colors text-left group"
          >
            <div className="w-8 h-8 rounded-full bg-cyan-950 border border-cyan-500/40 flex items-center justify-center font-bold text-xs text-cyan-300 shrink-0">
              {user?.fullName?.charAt(0) || 'U'}
            </div>
            <div className="hidden sm:block">
              <div className="text-xs font-semibold text-slate-200 group-hover:text-cyan-300 flex items-center gap-1.5 transition-colors">
                <span className="max-w-[120px] truncate">{user?.fullName || 'User'}</span>
                <User className="w-3 h-3 text-slate-500 group-hover:text-cyan-400 opacity-60 group-hover:opacity-100 transition-all" />
              </div>
              <div className="text-[10px] text-slate-400 font-mono">
                {user?.username ? `@${user.username}` : activeRole.replace('_', ' ')}
              </div>
            </div>
          </button>

          <button
            onClick={() => logout()}
            title="Sign out of CUOIS"
            className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-950/20 transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Edit Display Name Modal */}
      {showNameModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0E1524] border border-slate-700/80 rounded-2xl w-full max-w-sm p-6 shadow-2xl relative animate-in fade-in zoom-in-95">
            <button
              onClick={() => setShowNameModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-200"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2.5 mb-4">
              <div className="p-2 rounded-lg bg-cyan-950/60 border border-cyan-500/30 text-cyan-400">
                <User className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-100">Customize Your Name</h3>
                <p className="text-[11px] text-slate-400">Updates your name across the entire campus</p>
              </div>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (!editNameInput.trim()) return;
                setIsSavingName(true);
                try {
                  await updateUserName(editNameInput.trim());
                  setShowNameModal(false);
                } catch (err) {
                  console.error(err);
                } finally {
                  setIsSavingName(false);
                }
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Your Full Name
                </label>
                <input
                  type="text"
                  required
                  value={editNameInput}
                  onChange={(e) => setEditNameInput(e.target.value)}
                  placeholder="Enter your name..."
                  className="w-full bg-[#0A101D] border border-slate-700 focus:border-cyan-500 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 outline-none transition-colors"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNameModal(false)}
                  className="px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingName || !editNameInput.trim()}
                  className="px-4 py-1.5 rounded-lg text-xs font-medium bg-gradient-to-r from-cyan-600 to-blue-600 text-white hover:from-cyan-500 hover:to-blue-500 disabled:opacity-50 transition-all shadow-md"
                >
                  {isSavingName ? 'Saving...' : 'Save Name'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Developer & Sovereign Ownership Dossier Modal */}
      {showOwnershipDossier && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-[#0E1524] border border-cyan-500/40 rounded-2xl shadow-2xl p-6 sm:p-7 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="flex items-center justify-between pb-4 border-b border-slate-800 relative z-10">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-[0_0_15px_rgba(6,182,212,0.3)]">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold font-serif text-slate-100">
                    System Architecture & Ownership Dossier
                  </h3>
                  <p className="text-[11px] font-mono text-cyan-400">
                    Autonomous Sovereign Campus OS • Verified Credentials
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowOwnershipDossier(false)}
                className="text-slate-400 hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-5 space-y-4 relative z-10 text-xs">
              {/* Primary Identity Card */}
              <div className="p-4 rounded-xl bg-[#090F1E] border border-cyan-500/30 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 font-mono text-[11px] uppercase tracking-wider">Lead Software Architect:</span>
                  <span className="font-bold text-slate-100 text-sm font-serif">Imthiyas</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 font-mono text-[11px] uppercase tracking-wider">Sovereign System Owner:</span>
                  <Badge variant="cyan" className="font-bold text-xs px-2.5 py-0.5">
                    Imthiyas
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 font-mono text-[11px] uppercase tracking-wider">Official Inquiries & Contact:</span>
                  <a
                    href="mailto:imthiyasofficial28@gmail.com"
                    className="text-cyan-400 hover:text-cyan-300 underline font-mono text-xs font-semibold"
                  >
                    imthiyasofficial28@gmail.com
                  </a>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 font-mono text-[11px] uppercase tracking-wider">Platform Governance:</span>
                  <span className="text-emerald-400 font-mono font-semibold">100% Sovereign Root Authority</span>
                </div>
              </div>

              {/* Architectural Specifications */}
              <div className="space-y-2">
                <h4 className="font-mono text-[11px] font-semibold text-slate-300 uppercase tracking-wider">
                  Engineered Features & Autonomous Control
                </h4>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="p-2.5 rounded-lg bg-[#080D1A] border border-slate-800">
                    <span className="text-cyan-400 font-bold block mb-0.5">Zero Forced Demo Data</span>
                    <span className="text-slate-400">Clean blank start with 100% user data control.</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-[#080D1A] border border-slate-800">
                    <span className="text-cyan-400 font-bold block mb-0.5">Full CRUD Physical Twin</span>
                    <span className="text-slate-400">Add, edit, delete, and modify all campus 3D/2D buildings.</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-[#080D1A] border border-slate-800">
                    <span className="text-cyan-400 font-bold block mb-0.5">Cryptographic Security</span>
                    <span className="text-slate-400">Salted PBKDF2 64-byte derivation & RBAC control.</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-[#080D1A] border border-slate-800">
                    <span className="text-cyan-400 font-bold block mb-0.5">Real-Time Event Stream</span>
                    <span className="text-slate-400">Immediate state synchronization across all views.</span>
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-[11px] text-slate-400 leading-relaxed">
                This campus digital operating system was completely conceived, designed, architected, and coded by <strong className="text-slate-200">Imthiyas</strong>. All intellectual property, root sovereign control, and system administrative authority reside with <strong className="text-cyan-400">Imthiyas</strong>.
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard?.writeText('imthiyasofficial28@gmail.com');
                    alert('Official email copied to clipboard: imthiyasofficial28@gmail.com');
                  }}
                  className="px-3.5 py-2 rounded-lg text-xs font-mono bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
                >
                  Copy Owner Email
                </button>
                <button
                  type="button"
                  onClick={() => setShowOwnershipDossier(false)}
                  className="px-4 py-2 rounded-lg text-xs font-medium bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold transition-all shadow-md shadow-cyan-500/20"
                >
                  Close Dossier
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Google Drive Synchronization & Cloud Vault Modal */}
      <GoogleDriveSyncModal
        isOpen={isDriveModalOpen}
        onClose={() => setIsDriveModalOpen(false)}
      />
    </header>
  );
};
