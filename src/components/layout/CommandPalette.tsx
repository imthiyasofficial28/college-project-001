import React, { useState, useEffect } from 'react';
import {
  Search,
  LayoutDashboard,
  Building2,
  GraduationCap,
  Users,
  CalendarCheck,
  CalendarDays,
  MessageSquareWarning,
  Wrench,
  BookOpen,
  Bus,
  UserCheck,
  ShieldAlert,
  BrainCircuit,
  FileSpreadsheet,
  History,
  Settings,
  X,
  ArrowRight,
  User,
  Cloud,
} from 'lucide-react';
import { NavView } from './Sidebar.tsx';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectView: (view: NavView) => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  onSelectView,
}) => {
  const [query, setQuery] = useState('');

  const commands = [
    { label: 'My Personal Profile & Security Credentials (Maintain ID & Password)', view: 'profile' as NavView, icon: User, category: 'Personal' },
    { label: 'Campus Digital Twin (Spatial Telemetry & Sensors)', view: 'digital-twin' as NavView, icon: Building2, category: 'Navigation' },
    { label: 'Institution Data Control (Master Configuration)', view: 'institution-config' as NavView, icon: Settings, category: 'Administration' },
    { label: 'Confidential Whistleblower & Decryption Desk', view: 'confidential-reports' as NavView, icon: ShieldAlert, category: 'Governance' },
    { label: 'Campus Surveys & Anonymous Polling', view: 'surveys' as NavView, icon: MessageSquareWarning, category: 'Governance' },
    { label: 'Student Academic Risk Intelligence Radar', view: 'faculty-students-risk' as NavView, icon: Users, category: 'Academic' },
    { label: 'Student Academic Pulse (Student Cockpit)', view: 'student-dashboard' as NavView, icon: GraduationCap, category: 'Academic' },
    { label: 'Faculty Teaching Operations Cockpit', view: 'faculty-dashboard' as NavView, icon: Users, category: 'Academic' },
    { label: 'Course Curriculum, Hall Tickets & Marks', view: 'student-academics' as NavView, icon: GraduationCap, category: 'Academic' },
    { label: 'Command Center (Executive Dashboard)', view: 'dashboard' as NavView, icon: LayoutDashboard, category: 'Navigation' },
    { label: 'Campus & Facilities Map', view: 'infrastructure' as NavView, icon: Building2, category: 'Navigation' },
    { label: 'Students Directory & Academic Standing', view: 'students' as NavView, icon: GraduationCap, category: 'Navigation' },
    { label: 'Faculty & Departmental Rosters', view: 'faculty' as NavView, icon: Users, category: 'Navigation' },
    { label: 'Attendance Engine & Shortage Tracking', view: 'attendance' as NavView, icon: CalendarCheck, category: 'Navigation' },
    { label: 'Timetable Matrix & Conflict Checker', view: 'timetable' as NavView, icon: CalendarDays, category: 'Navigation' },
    { label: 'Grievance & Complaint Tracking Desk', view: 'complaints' as NavView, icon: MessageSquareWarning, category: 'Navigation' },
    { label: 'Maintenance & Facilities Work Orders', view: 'facilities' as NavView, icon: Wrench, category: 'Navigation' },
    { label: 'Library Catalog & Issue Desk', view: 'library' as NavView, icon: BookOpen, category: 'Navigation' },
    { label: 'Hostel Rooms & Campus Fleet', view: 'hostel-transport' as NavView, icon: Bus, category: 'Navigation' },
    { label: 'Visitor Pass & Gate Access Log', view: 'visitors' as NavView, icon: UserCheck, category: 'Navigation' },
    { label: 'Security Operations & Incident Log', view: 'security' as NavView, icon: ShieldAlert, category: 'Navigation' },
    { label: 'AI Intelligence Core (Fact / Prediction)', view: 'ai-command' as NavView, icon: BrainCircuit, category: 'AI Intelligence' },
    { label: 'User Directory & RBAC Security', view: 'users-rbac' as NavView, icon: Users, category: 'Administration' },
    { label: 'Audit Trail & Compliance Log', view: 'audit-logs' as NavView, icon: History, category: 'Administration' },
    { label: 'Batch Import & Data Export Engine', view: 'data-import' as NavView, icon: FileSpreadsheet, category: 'Administration' },
    { label: 'Google Drive Cloud Vault & Institutional Snapshots (Save & Sync)', view: 'settings' as NavView, icon: Cloud, category: 'Administration' },
    { label: 'System Settings & Institution Sovereignty', view: 'settings' as NavView, icon: Settings, category: 'Administration' },
  ];

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        isOpen ? onClose() : null;
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const filtered = commands.filter((c) =>
    c.label.toLowerCase().includes(query.toLowerCase()) ||
    c.category.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-xl bg-[#0E1524] border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Search input header */}
        <div className="flex items-center px-4 py-3.5 border-b border-slate-800 bg-[#0A101C]">
          <Search className="w-5 h-5 text-cyan-400 shrink-0" />
          <input
            autoFocus
            type="text"
            placeholder="Type a command, module, or search..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-transparent px-3 py-1 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none font-sans"
          />
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-100 p-1 rounded-lg hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results */}
        <div className="max-h-80 overflow-y-auto p-2 space-y-1">
          {filtered.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500 font-mono">
              No matching commands found.
            </div>
          ) : (
            filtered.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.label}
                  onClick={() => {
                    onSelectView(item.view);
                    onClose();
                  }}
                  className="w-full flex items-center justify-between p-2.5 rounded-xl text-left hover:bg-slate-800/60 group transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-cyan-400 group-hover:border-cyan-500/40">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-medium text-slate-200">{item.label}</div>
                      <div className="text-[10px] font-mono text-slate-500">{item.category}</div>
                    </div>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-cyan-400 transition-colors" />
                </button>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 bg-[#080D18] border-t border-slate-800 text-[11px] font-mono text-slate-500 flex items-center justify-between">
          <span>Navigate with mouse or touch</span>
          <div className="flex items-center gap-1.5">
            <kbd className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-[10px]">ESC</kbd>
            <span>to close</span>
          </div>
        </div>
      </div>
    </div>
  );
};
