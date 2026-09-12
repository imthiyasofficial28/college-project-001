import React from 'react';
import {
  LayoutDashboard,
  Building2,
  GraduationCap,
  Users,
  CalendarCheck,
  CalendarDays,
  MessageSquareWarning,
  Wrench,
  BookOpen,
  Hotel,
  Bus,
  UserCheck,
  ShieldAlert,
  BrainCircuit,
  FileSpreadsheet,
  ShieldCheck,
  History,
  Settings,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '../../lib/auth-context.tsx';

export type NavView =
  | 'dashboard'
  | 'infrastructure'
  | 'students'
  | 'faculty'
  | 'attendance'
  | 'timetable'
  | 'complaints'
  | 'facilities'
  | 'library'
  | 'hostel-transport'
  | 'visitors'
  | 'security'
  | 'ai-command'
  | 'data-import'
  | 'users-rbac'
  | 'audit-logs'
  | 'settings';

interface SidebarProps {
  currentView: NavView;
  onSelectView: (view: NavView) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onSelectView,
  isCollapsed,
  onToggleCollapse,
}) => {
  const { user, activeRole, hasPermission } = useAuth();

  const navGroups = [
    {
      label: 'OPERATIONS CORE',
      items: [
        { id: 'dashboard' as NavView, label: 'Command Center', icon: LayoutDashboard },
        { id: 'infrastructure' as NavView, label: 'Campuses & Departments', icon: Building2 },
      ],
    },
    {
      label: 'ACADEMIC MATRIX',
      items: [
        { id: 'students' as NavView, label: 'Students Directory', icon: GraduationCap },
        { id: 'faculty' as NavView, label: 'Faculty & Staff', icon: Users },
        { id: 'attendance' as NavView, label: 'Attendance Engine', icon: CalendarCheck },
        { id: 'timetable' as NavView, label: 'Timetable Matrix', icon: CalendarDays },
      ],
    },
    {
      label: 'CAMPUS SERVICES',
      items: [
        { id: 'complaints' as NavView, label: 'Grievance Desk', icon: MessageSquareWarning },
        { id: 'facilities' as NavView, label: 'Maintenance & Works', icon: Wrench },
        { id: 'library' as NavView, label: 'Library Catalog', icon: BookOpen },
        { id: 'hostel-transport' as NavView, label: 'Hostel & Fleet', icon: Bus },
        { id: 'visitors' as NavView, label: 'Visitor Passes', icon: UserCheck },
      ],
    },
    {
      label: 'SECURITY & INTELLIGENCE',
      items: [
        { id: 'security' as NavView, label: 'Security Operations', icon: ShieldAlert },
        { id: 'ai-command' as NavView, label: 'AI Intelligence Core', icon: BrainCircuit },
      ],
    },
    {
      label: 'GOVERNANCE & ADMIN',
      items: [
        { id: 'users-rbac' as NavView, label: 'User Directory & RBAC', icon: ShieldCheck, adminOnly: true },
        { id: 'audit-logs' as NavView, label: 'Audit Trail', icon: History },
        { id: 'data-import' as NavView, label: 'Data Import / Export', icon: FileSpreadsheet, adminOnly: true },
        { id: 'settings' as NavView, label: 'System Settings', icon: Settings, adminOnly: true },
      ],
    },
  ];

  const isItemVisible = (item: { id: NavView; adminOnly?: boolean }) => {
    if (activeRole === 'SYSTEM_OWNER' || activeRole === 'ADMINISTRATOR') return true;
    if (activeRole === 'EDITOR') {
      return ['dashboard', 'infrastructure', 'library', 'hostel-transport', 'complaints', 'facilities', 'ai-command', 'audit-logs'].includes(item.id);
    }
    if (item.adminOnly) return false;
    if (activeRole === 'SECURITY' && ['dashboard', 'infrastructure', 'visitors', 'security', 'ai-command', 'audit-logs'].includes(item.id)) return true;
    if (activeRole === 'FACILITIES_STAFF' && ['dashboard', 'infrastructure', 'facilities', 'complaints', 'hostel-transport', 'ai-command'].includes(item.id)) return true;
    if (activeRole === 'STUDENT' && ['dashboard', 'students', 'attendance', 'timetable', 'complaints', 'library', 'ai-command'].includes(item.id)) return true;
    if (activeRole === 'FACULTY' && ['dashboard', 'students', 'faculty', 'attendance', 'timetable', 'complaints', 'library', 'ai-command'].includes(item.id)) return true;
    return true;
  };

  return (
    <aside
      className={`${
        isCollapsed ? 'w-16' : 'w-64'
      } bg-[#080D18] border-r border-slate-800/80 flex flex-col justify-between transition-all duration-300 select-none z-20 shrink-0`}
    >
      {/* Navigation List */}
      <div className="overflow-y-auto overflow-x-hidden p-3 space-y-6 flex-1 py-4">
        {navGroups.map((group) => {
          const visibleItems = group.items.filter(isItemVisible);
          if (visibleItems.length === 0) return null;

          return (
            <div key={group.label} className="space-y-1">
              {!isCollapsed && (
                <div className="px-3 text-[10px] font-mono font-semibold tracking-wider text-slate-500 uppercase mb-2">
                  {group.label}
                </div>
              )}
              {visibleItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentView === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => onSelectView(item.id)}
                    title={isCollapsed ? item.label : undefined}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                      isActive
                        ? 'bg-cyan-950/60 text-cyan-300 border border-cyan-500/30 font-semibold shadow-[0_0_15px_rgba(6,182,212,0.15)]'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                    }`}
                  >
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
                    {!isCollapsed && <span className="truncate">{item.label}</span>}
                  </button>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* Collapse Toggle Footer */}
      <div className="p-3 border-t border-slate-800/80 bg-[#060A13]">
        <button
          onClick={onToggleCollapse}
          className="w-full flex items-center justify-center p-2 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800/50 transition-colors"
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <div className="flex items-center gap-2 text-xs font-mono"><ChevronLeft className="w-4 h-4" /> <span>Collapse</span></div>}
        </button>
      </div>
    </aside>
  );
};
