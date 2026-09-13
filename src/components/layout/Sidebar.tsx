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
  Vote,
  Lock,
  AlertTriangle,
  FileText,
  Radio,
  School,
  Sparkles,
  BookMarked,
  Bell,
  Award,
  User,
} from 'lucide-react';
import { useAuth } from '../../lib/auth-context.tsx';

export type NavView =
  // Universal Profile
  | 'profile'
  // System Owner & Admin views
  | 'dashboard'
  | 'digital-twin'
  | 'institution-config'
  | 'infrastructure'
  | 'students'
  | 'faculty'
  | 'attendance'
  | 'timetable'
  | 'complaints'
  | 'confidential-reports'
  | 'surveys'
  | 'facilities'
  | 'library'
  | 'hostel-transport'
  | 'visitors'
  | 'security'
  | 'ai-command'
  | 'data-import'
  | 'users-rbac'
  | 'audit-logs'
  | 'settings'
  // Student views
  | 'student-dashboard'
  | 'student-academics'
  | 'student-attendance'
  | 'student-timetable'
  | 'student-assignments'
  | 'student-examinations'
  | 'student-surveys'
  | 'student-confidential-report'
  | 'student-announcements'
  | 'student-services'
  | 'student-ai-advisor'
  // Faculty views
  | 'faculty-dashboard'
  | 'faculty-timetable'
  | 'faculty-attendance'
  | 'faculty-assignments'
  | 'faculty-students-risk'
  | 'faculty-maintenance'
  | 'faculty-surveys'
  | 'faculty-confidential-report'
  | 'faculty-ai-assistant';

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
  const { user, activeRole } = useAuth();

  // Role-Specific Navigation Definitions
  let navGroups: { label: string; items: { id: NavView; label: string; icon: any }[] }[] = [];

  if (activeRole === 'STUDENT') {
    navGroups = [
      {
        label: 'ACADEMIC COCKPIT',
        items: [
          { id: 'student-dashboard', label: 'Academic Pulse', icon: LayoutDashboard },
          { id: 'student-academics', label: 'Courses & Curriculum', icon: GraduationCap },
          { id: 'student-attendance', label: 'Attendance Radar', icon: CalendarCheck },
          { id: 'student-timetable', label: 'Class Schedule', icon: CalendarDays },
        ],
      },
      {
        label: 'STUDENT ENGAGEMENT',
        items: [
          { id: 'student-assignments', label: 'Coursework & Tasks', icon: FileText },
          { id: 'student-surveys', label: 'Campus Surveys', icon: Vote },
          { id: 'student-confidential-report', label: 'Confidential Desk', icon: Lock },
          { id: 'student-announcements', label: 'Notices & Alerts', icon: Bell },
        ],
      },
      {
        label: 'SERVICES & AI',
        items: [
          { id: 'student-services', label: 'Library, Hostel & Bus', icon: Bus },
          { id: 'student-ai-advisor', label: 'AI Academic Advisor', icon: Sparkles },
          { id: 'profile', label: 'My Personal Profile', icon: User },
        ],
      },
    ];
  } else if (activeRole === 'FACULTY') {
    navGroups = [
      {
        label: 'TEACHING COCKPIT',
        items: [
          { id: 'faculty-dashboard', label: 'Faculty Cockpit', icon: LayoutDashboard },
          { id: 'faculty-timetable', label: 'Teaching Schedule', icon: CalendarDays },
          { id: 'faculty-attendance', label: 'Batch Attendance', icon: CalendarCheck },
        ],
      },
      {
        label: 'ACADEMIC MANAGEMENT',
        items: [
          { id: 'faculty-assignments', label: 'Assignments & Tests', icon: FileText },
          { id: 'faculty-students-risk', label: 'Student Risk Radar', icon: AlertTriangle },
          { id: 'faculty-maintenance', label: 'Report Classroom Issue', icon: Wrench },
        ],
      },
      {
        label: 'FACULTY VOICE & AI',
        items: [
          { id: 'faculty-surveys', label: 'Surveys & Feedback', icon: Vote },
          { id: 'faculty-confidential-report', label: 'Confidential Desk', icon: Lock },
          { id: 'faculty-ai-assistant', label: 'AI Teaching Copilot', icon: Sparkles },
          { id: 'profile', label: 'My Personal Profile', icon: User },
        ],
      },
    ];
  } else if (activeRole === 'SECURITY') {
    navGroups = [
      {
        label: 'SECURITY COCKPIT',
        items: [
          { id: 'dashboard', label: 'Command Center', icon: LayoutDashboard },
          { id: 'digital-twin', label: 'Campus Digital Twin', icon: Radio },
          { id: 'security', label: 'Security Operations', icon: ShieldAlert },
          { id: 'visitors', label: 'Visitor Passes', icon: UserCheck },
          { id: 'audit-logs', label: 'Audit Trail', icon: History },
          { id: 'ai-command', label: 'AI Intelligence', icon: BrainCircuit },
          { id: 'profile', label: 'My Profile & Pass', icon: User },
        ],
      },
    ];
  } else if (activeRole === 'FACILITIES_STAFF') {
    navGroups = [
      {
        label: 'FACILITIES COCKPIT',
        items: [
          { id: 'dashboard', label: 'Command Center', icon: LayoutDashboard },
          { id: 'digital-twin', label: 'Campus Digital Twin', icon: Radio },
          { id: 'facilities', label: 'Maintenance & Works', icon: Wrench },
          { id: 'hostel-transport', label: 'Hostel & Fleet', icon: Bus },
          { id: 'complaints', label: 'Grievance Desk', icon: MessageSquareWarning },
          { id: 'ai-command', label: 'AI Intelligence', icon: BrainCircuit },
          { id: 'profile', label: 'My Profile & Pass', icon: User },
        ],
      },
    ];
  } else {
    // SYSTEM_OWNER / ADMINISTRATOR (Full Sovereign Access)
    navGroups = [
      {
        label: 'SOVEREIGN OPERATIONS',
        items: [
          { id: 'dashboard', label: 'Command Center', icon: LayoutDashboard },
          { id: 'digital-twin', label: 'Campus Digital Twin', icon: Radio },
          { id: 'institution-config', label: 'Institution Data Control', icon: School },
          { id: 'infrastructure', label: 'Campuses & Departments', icon: Building2 },
        ],
      },
      {
        label: 'ACADEMIC MATRIX',
        items: [
          { id: 'students', label: 'Students Directory', icon: GraduationCap },
          { id: 'faculty', label: 'Faculty & Staff', icon: Users },
          { id: 'attendance', label: 'Attendance Engine', icon: CalendarCheck },
          { id: 'timetable', label: 'Timetable Matrix', icon: CalendarDays },
          { id: 'faculty-students-risk', label: 'Student Risk Radar', icon: AlertTriangle },
        ],
      },
      {
        label: 'GOVERNANCE & TRUST',
        items: [
          { id: 'confidential-reports', label: 'Confidential Decryption Desk', icon: Lock },
          { id: 'surveys', label: 'Survey Governance', icon: Vote },
          { id: 'complaints', label: 'Grievance Desk', icon: MessageSquareWarning },
          { id: 'audit-logs', label: 'Audit Trail', icon: History },
        ],
      },
      {
        label: 'CAMPUS SERVICES & LOGISTICS',
        items: [
          { id: 'facilities', label: 'Maintenance & Works', icon: Wrench },
          { id: 'library', label: 'Library Catalog', icon: BookOpen },
          { id: 'hostel-transport', label: 'Hostel & Fleet', icon: Bus },
          { id: 'visitors', label: 'Visitor Passes', icon: UserCheck },
          { id: 'security', label: 'Security Operations', icon: ShieldAlert },
        ],
      },
      {
        label: 'INTELLIGENCE & ADMIN',
        items: [
          { id: 'ai-command', label: 'AI Intelligence Core', icon: BrainCircuit },
          { id: 'users-rbac', label: 'User Directory & RBAC', icon: ShieldCheck },
          { id: 'profile', label: 'My Personal Profile', icon: User },
          { id: 'data-import', label: 'Data Import / Export', icon: FileSpreadsheet },
          { id: 'settings', label: 'System Settings', icon: Settings },
        ],
      },
    ];
  }

  return (
    <aside
      className={`${
        isCollapsed ? 'w-16' : 'w-64'
      } bg-[#080D18] border-r border-slate-800/80 flex flex-col justify-between transition-all duration-300 select-none z-20 shrink-0`}
    >
      {/* Navigation List */}
      <div className="overflow-y-auto overflow-x-hidden p-3 space-y-6 flex-1 py-4">
        {navGroups.map((group) => (
          <div key={group.label} className="space-y-1">
            {!isCollapsed && (
              <div className="px-3 text-[10px] font-mono font-semibold tracking-wider text-slate-500 uppercase mb-2">
                {group.label}
              </div>
            )}
            {group.items.map((item) => {
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
        ))}
      </div>

      {/* Collapse Toggle Footer */}
      <div className="p-3 border-t border-slate-800/80 bg-[#060A13]">
        <button
          onClick={onToggleCollapse}
          className="w-full flex items-center justify-center p-2 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800/50 transition-colors"
        >
          {isCollapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <div className="flex items-center gap-2 text-xs font-mono">
              <ChevronLeft className="w-4 h-4" /> <span>Collapse</span>
            </div>
          )}
        </button>
      </div>
    </aside>
  );
};
