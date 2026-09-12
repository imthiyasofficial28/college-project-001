import React, { useState } from 'react';
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
} from 'lucide-react';
import { useAuth } from '../../lib/auth-context.tsx';
import { UserRole } from '../../types/index.ts';
import { Badge } from '../ui/badge.tsx';

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
    logout,
    switchPerspective,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    refreshState,
  } = useAuth();

  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

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
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-2 md:gap-3">
        {/* Real-time Telemetry Pill */}
        {liveTelemetry && (
          <div className="hidden lg:flex items-center gap-2 px-2.5 py-1 rounded-full bg-[#0E1524] border border-slate-800 text-[11px] font-mono text-slate-300">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>LIVE</span>
            <span className="text-slate-600">|</span>
            <span className="text-cyan-400">{liveTelemetry.activeUsersCount} active</span>
            <span className="text-slate-600">|</span>
            <span className="text-slate-400">{liveTelemetry.uptimeSeconds}s up</span>
          </div>
        )}

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
          <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-xs text-cyan-300">
            {user?.fullName?.charAt(0) || 'U'}
          </div>
          <button
            onClick={() => logout()}
            title="Sign out of CUOIS"
            className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-950/20 transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
