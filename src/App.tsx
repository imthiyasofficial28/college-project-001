import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './lib/auth-context.tsx';
import { DriveProvider } from './lib/drive-context.tsx';
import { Navbar } from './components/layout/Navbar.tsx';
import { Sidebar, NavView } from './components/layout/Sidebar.tsx';
import { CommandPalette } from './components/layout/CommandPalette.tsx';
import { BootstrapSetupView } from './components/views/BootstrapSetupView.tsx';
import { LoginView } from './components/views/LoginView.tsx';
import { DashboardView } from './components/views/DashboardView.tsx';
import { StudentsView } from './components/views/StudentsView.tsx';
import { AttendanceView } from './components/views/AttendanceView.tsx';
import { TimetableView } from './components/views/TimetableView.tsx';
import { ComplaintsView } from './components/views/ComplaintsView.tsx';
import { FacilitiesView } from './components/views/FacilitiesView.tsx';
import { InfrastructureView } from './components/views/InfrastructureView.tsx';
import { FacultyView } from './components/views/FacultyView.tsx';
import { LibraryView } from './components/views/LibraryView.tsx';
import { HostelTransportView } from './components/views/HostelTransportView.tsx';
import { VisitorsView } from './components/views/VisitorsView.tsx';
import { SecurityView } from './components/views/SecurityView.tsx';
import { AICommandView } from './components/views/AICommandView.tsx';
import { UsersRbacView } from './components/views/UsersRbacView.tsx';
import { AuditLogsView } from './components/views/AuditLogsView.tsx';
import { DataImportView } from './components/views/DataImportView.tsx';
import { SettingsView } from './components/views/SettingsView.tsx';
import { ProfileView } from './components/views/ProfileView.tsx';

// Role-specific and high-capability views
import { StudentDashboardView } from './components/views/StudentDashboardView.tsx';
import { FacultyDashboardView } from './components/views/FacultyDashboardView.tsx';
import { DigitalTwinView } from './components/views/DigitalTwinView.tsx';
import { InstitutionConfigView } from './components/views/InstitutionConfigView.tsx';
import { ConfidentialReportsView } from './components/views/ConfidentialReportsView.tsx';
import { SurveysView } from './components/views/SurveysView.tsx';
import { StudentRiskView } from './components/views/StudentRiskView.tsx';
import { StudentAcademicsView } from './components/views/StudentAcademicsView.tsx';

import { Loader2 } from 'lucide-react';

const AppContent: React.FC = () => {
  const { isBootstrapped, user, activeRole, isLoading } = useAuth();
  const [currentView, setCurrentView] = useState<NavView>('dashboard');
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);

  // Sync initial view to role when role changes
  useEffect(() => {
    if (activeRole === 'STUDENT') {
      setCurrentView('student-dashboard');
    } else if (activeRole === 'FACULTY') {
      setCurrentView('faculty-dashboard');
    } else if (activeRole === 'SYSTEM_OWNER' || activeRole === 'ADMINISTRATOR') {
      setCurrentView((prev) => {
        if (prev.startsWith('student-') || prev.startsWith('faculty-')) {
          return 'dashboard';
        }
        return prev;
      });
    }
  }, [activeRole]);

  // Global shortcut to open command palette (Cmd+K / Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#06090F] flex flex-col items-center justify-center text-slate-300">
        <div className="flex items-center gap-3 p-6 rounded-2xl bg-[#0A101C] border border-cyan-500/30 shadow-2xl">
          <Loader2 className="w-6 h-6 text-cyan-400 animate-spin" />
          <div className="font-mono text-xs text-slate-300 tracking-wider uppercase">
            Initializing CUOIS Executive Kernel...
          </div>
        </div>
      </div>
    );
  }

  // 1. Initial empty bootstrap wizard
  if (!isBootstrapped) {
    return <BootstrapSetupView />;
  }

  // 2. Authentication Login Screen
  if (!user) {
    return <LoginView />;
  }

  // 3. Authenticated Campus Operations & Role Routing
  const renderActiveView = () => {
    switch (currentView) {
      // Student Specialized Views
      case 'student-dashboard':
        return <StudentDashboardView onNavigate={setCurrentView} />;
      case 'student-academics':
      case 'student-examinations':
      case 'student-assignments':
        return <StudentAcademicsView />;
      case 'student-attendance':
        return <AttendanceView />;
      case 'student-timetable':
        return <TimetableView />;
      case 'student-surveys':
        return <SurveysView />;
      case 'student-confidential-report':
        return <ConfidentialReportsView />;
      case 'student-announcements':
      case 'student-services':
        return <HostelTransportView />;
      case 'student-ai-advisor':
        return <AICommandView />;

      // Faculty Specialized Views
      case 'faculty-dashboard':
        return <FacultyDashboardView onNavigate={setCurrentView} />;
      case 'faculty-timetable':
        return <TimetableView />;
      case 'faculty-attendance':
        return <AttendanceView />;
      case 'faculty-assignments':
        return <StudentAcademicsView />;
      case 'faculty-students-risk':
        return <StudentRiskView />;
      case 'faculty-maintenance':
        return <FacilitiesView />;
      case 'faculty-surveys':
        return <SurveysView />;
      case 'faculty-confidential-report':
        return <ConfidentialReportsView />;
      case 'faculty-ai-assistant':
        return <AICommandView />;

      // System Owner & Sovereign Management Views
      case 'digital-twin':
        return <DigitalTwinView />;
      case 'institution-config':
        return <InstitutionConfigView />;
      case 'confidential-reports':
        return <ConfidentialReportsView />;
      case 'surveys':
        return <SurveysView />;
      case 'dashboard':
        return <DashboardView onNavigate={setCurrentView} />;
      case 'students':
        return <StudentsView />;
      case 'attendance':
        return <AttendanceView />;
      case 'timetable':
        return <TimetableView />;
      case 'complaints':
        return <ComplaintsView />;
      case 'facilities':
        return <FacilitiesView />;
      case 'infrastructure':
        return <InfrastructureView />;
      case 'faculty':
        return <FacultyView />;
      case 'library':
        return <LibraryView />;
      case 'hostel-transport':
        return <HostelTransportView />;
      case 'visitors':
        return <VisitorsView />;
      case 'security':
        return <SecurityView />;
      case 'ai-command':
        return <AICommandView />;
      case 'users-rbac':
        return <UsersRbacView />;
      case 'audit-logs':
        return <AuditLogsView />;
      case 'data-import':
        return <DataImportView />;
      case 'settings':
        return <SettingsView />;
      case 'profile':
        return <ProfileView onNavigate={setCurrentView} />;

      default:
        if (activeRole === 'STUDENT') return <StudentDashboardView onNavigate={setCurrentView} />;
        if (activeRole === 'FACULTY') return <FacultyDashboardView onNavigate={setCurrentView} />;
        return <DashboardView onNavigate={setCurrentView} />;
    }
  };

  return (
    <div className="min-h-screen bg-[#06090F] text-slate-100 flex flex-col selection:bg-cyan-500 selection:text-black">
      {/* Top Navigation */}
      <Navbar
        onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
        onNavigate={setCurrentView}
      />

      {/* Main Workspace Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Persistent Executive Sidebar */}
        <Sidebar
          currentView={currentView}
          onSelectView={setCurrentView}
          isCollapsed={isCollapsed}
          onToggleCollapse={() => setIsCollapsed((prev) => !prev)}
        />

        {/* Viewport Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-[#06090F]">
          <div className="max-w-7xl mx-auto">{renderActiveView()}</div>
        </main>
      </div>

      {/* Spotlight Command Palette (Cmd+K) */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onSelectView={setCurrentView}
      />
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <DriveProvider>
        <AppContent />
      </DriveProvider>
    </AuthProvider>
  );
}
