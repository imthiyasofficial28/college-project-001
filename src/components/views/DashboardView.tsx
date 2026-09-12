import React, { useState, useEffect } from 'react';
import {
  GraduationCap,
  Users,
  CalendarCheck,
  AlertTriangle,
  Building2,
  ShieldCheck,
  BrainCircuit,
  Clock,
  ArrowUpRight,
  TrendingDown,
  Wrench,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../lib/auth-context.tsx';
import { api } from '../../lib/api.ts';
import {
  Student,
  Faculty,
  AttendanceRecord,
  Complaint,
  MaintenanceRequest,
  SecurityIncident,
  TimetableEntry,
} from '../../types/index.ts';
import { MetricCard, Card } from '../ui/card.tsx';
import { Badge } from '../ui/badge.tsx';
import { Button } from '../ui/button.tsx';
import { NavView } from '../layout/Sidebar.tsx';

interface DashboardViewProps {
  onNavigate: (view: NavView) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ onNavigate }) => {
  const { user, activeRole, institution, liveTelemetry } = useAuth();

  const [students, setStudents] = useState<Student[]>([]);
  const [faculty, setFaculty] = useState<Faculty[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [maintenance, setMaintenance] = useState<MaintenanceRequest[]>([]);
  const [incidents, setIncidents] = useState<SecurityIncident[]>([]);
  const [timetable, setTimetable] = useState<TimetableEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const [s, f, a, c, m, inc, t] = await Promise.all([
          api.getStudents(),
          api.getFaculty(),
          api.getAttendance(),
          api.getComplaints(),
          api.getMaintenanceRequests(),
          api.getSecurityIncidents(),
          api.getTimetable(),
        ]);
        if (isMounted) {
          setStudents(s);
          setFaculty(f);
          setAttendance(a);
          setComplaints(c);
          setMaintenance(m);
          setIncidents(inc);
          setTimetable(t);
          setIsLoading(false);
        }
      } catch (err) {
        console.error('Failed to load dashboard metrics:', err);
        if (isMounted) setIsLoading(false);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, []);

  // Compute stats
  const totalStudents = students.length;
  const totalFaculty = faculty.length;
  const avgAttendance =
    students.length > 0
      ? (students.reduce((acc, curr) => acc + curr.attendancePercentage, 0) / students.length).toFixed(1)
      : '0.0';

  const lowAttendanceStudents = students.filter((s) => s.attendancePercentage < 75);
  const activeComplaints = complaints.filter((c) => c.status !== 'CLOSED');
  const activeMaintenance = maintenance.filter((m) => m.status !== 'CLOSED');
  const criticalIncidents = incidents.filter((i) => i.severity === 'CRITICAL' || i.severity === 'HIGH');

  return (
    <div className="space-y-6">
      {/* Top Banner / Operational Posture */}
      <div className="rounded-2xl p-5 sm:p-6 bg-gradient-to-r from-[#0C1425] via-[#0E182D] to-[#0A101C] border border-cyan-500/20 shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-xs font-mono font-semibold uppercase tracking-wider text-cyan-400">
                {institution?.name || 'CAMPUS UNIFIED OPERATIONS CENTER'}
              </span>
              <Badge variant="success" size="sm" dot>
                DEFCON NOMINAL
              </Badge>
            </div>
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-slate-100 tracking-tight">
              Operational Command Center
            </h1>
            <p className="text-xs text-slate-400 mt-1 max-w-xl">
              Connected telemetry across academics, facility automation, transport fleets, and gate security.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Button
              variant="outline"
              size="sm"
              icon={CalendarCheck}
              onClick={() => onNavigate('attendance')}
            >
              Mark Attendance
            </Button>
            <Button
              variant="outline"
              size="sm"
              icon={Wrench}
              onClick={() => onNavigate('facilities')}
            >
              Work Orders
            </Button>
            <Button
              variant="primary"
              size="sm"
              icon={BrainCircuit}
              onClick={() => onNavigate('ai-command')}
            >
              Query AI Core
            </Button>
          </div>
        </div>
      </div>

      {/* Metric Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Enrolled Students"
          value={totalStudents}
          change="+4.2%"
          changeType="positive"
          icon={GraduationCap}
          sublabel={`${students.filter((s) => s.feeStatus === 'PAID').length} in good fee standing`}
        />
        <MetricCard
          label="Academic Faculty"
          value={totalFaculty}
          change="100% active"
          changeType="neutral"
          icon={Users}
          sublabel="Distributed across 4 departments"
        />
        <MetricCard
          label="Cohort Attendance Rate"
          value={`${avgAttendance}%`}
          change={`${lowAttendanceStudents.length} shortage alert`}
          changeType={lowAttendanceStudents.length > 0 ? 'negative' : 'positive'}
          icon={CalendarCheck}
          sublabel="Threshold enforced at 75%"
        />
        <MetricCard
          label="Active Service Tickets"
          value={activeComplaints.length + activeMaintenance.length}
          change="3 in queue"
          changeType={activeComplaints.length > 0 ? 'negative' : 'positive'}
          icon={AlertTriangle}
          sublabel={`${activeComplaints.length} grievances, ${activeMaintenance.length} maintenance`}
        />
      </div>

      {/* Mid Section: Interactive Insights & Schedule */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Attendance Shortfall Watchlist */}
        <div className="lg:col-span-2 space-y-6">
          <Card
            title="Attendance Threshold Watchlist (< 75%)"
            subtitle="Automated warning triggers for exam admit card withholding"
            icon={TrendingDown}
            action={
              <Button size="sm" variant="ghost" onClick={() => onNavigate('attendance')}>
                View Engine <ArrowUpRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            }
          >
            {lowAttendanceStudents.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400 font-mono flex items-center justify-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>All active students are meeting or exceeding the 75% attendance quota.</span>
              </div>
            ) : (
              <div className="divide-y divide-slate-800/60">
                {lowAttendanceStudents.map((s) => (
                  <div key={s.id} className="py-3 flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-slate-200">{s.fullName}</span>
                        <span className="text-[10px] font-mono text-slate-400">({s.registrationNumber})</span>
                      </div>
                      <p className="text-[11px] text-slate-400 truncate mt-0.5">
                        {s.departmentName} • Section {s.sectionName} • Semester {s.currentSemester}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <Badge variant="danger" size="sm">
                        {s.attendancePercentage}% Rate
                      </Badge>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => alert(`Advisory notification dispatched to ${s.guardianEmail}`)}
                      >
                        Notify Guardian
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Today's Timetable Section */}
          <Card
            title="Today's Timetable Schedule"
            subtitle="Real-time room allocation & lecturer assignment"
            icon={Clock}
            action={
              <Button size="sm" variant="ghost" onClick={() => onNavigate('timetable')}>
                Full Matrix <ArrowUpRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            }
          >
            <div className="space-y-3">
              {timetable.slice(0, 3).map((slot) => (
                <div
                  key={slot.id}
                  className="p-3.5 rounded-xl bg-[#090E17] border border-slate-800/80 flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-cyan-950/40 text-cyan-400 border border-cyan-500/20 font-mono text-xs font-bold shrink-0">
                      {slot.startTime}
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-slate-200">{slot.subjectName}</div>
                      <p className="text-[11px] text-slate-400">
                        {slot.facultyName} • Section {slot.sectionName}
                      </p>
                    </div>
                  </div>
                  <Badge variant="info" size="sm">
                    {slot.roomNumber}
                  </Badge>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Right Column: Active Incidents & Real-time AI Digest */}
        <div className="space-y-6">
          {/* AI Intelligence Snapshot */}
          <Card
            title="Campus AI Operational Pulse"
            subtitle="Automated predictive synthesis"
            icon={Sparkles}
            action={
              <Badge variant="accent" size="sm">
                Gemini 3.8
              </Badge>
            }
          >
            <div className="p-3.5 rounded-xl bg-violet-950/20 border border-violet-500/20 space-y-3">
              <div className="text-xs font-semibold text-violet-200 flex items-center gap-1.5">
                <BrainCircuit className="w-4 h-4 text-violet-400" />
                <span>Executive AI Synthesis</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Campus operations are operating in normal parameters. Facility ticket #CMP-2025-0042 in Turing Lab requires HVAC sensor inspection before 15:00 to prevent lab thermal shutdown.
              </p>
              <div className="pt-2 border-t border-violet-500/20 flex items-center justify-between">
                <span className="text-[10px] font-mono text-slate-400">Grounded in 7 relational tables</span>
                <Button size="sm" variant="accent" onClick={() => onNavigate('ai-command')}>
                  Query AI
                </Button>
              </div>
            </div>
          </Card>

          {/* Security & Gate Flow Snapshot */}
          <Card
            title="Gate & Perimeter Security"
            subtitle="Access points & guard stations"
            icon={ShieldCheck}
            action={
              <Button size="sm" variant="ghost" onClick={() => onNavigate('security')}>
                Security Log <ArrowUpRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            }
          >
            <div className="space-y-2.5">
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-[#090E17] border border-slate-800 text-xs">
                <span className="text-slate-300 font-medium">Main Gate 1 (Automated Boom)</span>
                <Badge variant="success" size="sm" dot>
                  ACTIVE
                </Badge>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-[#090E17] border border-slate-800 text-xs">
                <span className="text-slate-300 font-medium">North Pedestrian Turnstiles</span>
                <Badge variant="success" size="sm" dot>
                  ACTIVE
                </Badge>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-[#090E17] border border-slate-800 text-xs">
                <span className="text-slate-300 font-medium">Hostel Quad Perimeter Sensor</span>
                <Badge variant="success" size="sm" dot>
                  ONLINE
                </Badge>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
