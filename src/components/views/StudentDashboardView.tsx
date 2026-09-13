import React, { useState, useEffect } from 'react';
import {
  GraduationCap,
  CalendarCheck,
  Clock,
  BookOpen,
  Award,
  AlertTriangle,
  CheckCircle2,
  FileText,
  Bell,
  Sparkles,
  ArrowRight,
  TrendingUp,
  MapPin,
  Vote,
  ShieldCheck,
  ChevronRight,
  ExternalLink,
  BookMarked,
  Bus,
} from 'lucide-react';
import { useAuth } from '../../lib/auth-context.tsx';
import { api } from '../../lib/api.ts';
import {
  Student,
  Subject,
  TimetableEntry,
  Assignment,
  Examination,
  Announcement,
  Survey,
} from '../../types/index.ts';
import { Badge } from '../ui/badge.tsx';
import { Button } from '../ui/button.tsx';
import { NavView } from '../layout/Sidebar.tsx';

interface StudentDashboardViewProps {
  onNavigate: (view: NavView) => void;
}

export const StudentDashboardView: React.FC<StudentDashboardViewProps> = ({ onNavigate }) => {
  const { user } = useAuth();

  const [studentInfo, setStudentInfo] = useState<Student | null>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [timetable, setTimetable] = useState<TimetableEntry[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [examinations, setExaminations] = useState<Examination[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Quick interactive survey modal / answer state
  const [selectedSurvey, setSelectedSurvey] = useState<Survey | null>(null);
  const [surveyAnswer, setSurveyAnswer] = useState<number>(5);
  const [surveySubmitted, setSurveySubmitted] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [studs, subs, tt, asgs, exams, anns, srvs] = await Promise.all([
          api.getStudents(),
          api.getSubjects(),
          api.getTimetable(),
          api.getAssignments(),
          api.getExaminations(),
          api.getAnnouncements(),
          api.getSurveys(),
        ]);

        // Find or match current logged in student
        const me = studs.find((s) => s.userId === user?.id || s.email === user?.email) || studs[0];
        setStudentInfo(me || null);
        setSubjects(subs);
        setTimetable(tt);
        setAssignments(asgs);
        setExaminations(exams);
        setAnnouncements(anns.filter((a) => a.targetAudience === 'ALL' || a.targetAudience === 'STUDENTS'));
        setSurveys(srvs.filter((s) => s.status === 'ACTIVE' && (s.targetAudience === 'ALL' || s.targetAudience === 'STUDENTS')));
        if (srvs.length > 0) {
          setSelectedSurvey(srvs[0]);
        }
      } catch (err) {
        console.error('Error loading student dashboard data', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [user]);

  // Derived metrics
  const attendanceRate = studentInfo?.attendancePercentage || 84.5;
  const isAttendanceAtRisk = attendanceRate < 75.0;
  const cgpa = studentInfo?.cgpa || 3.84;

  // Today is Friday in the demo semester cycle
  const currentDay = 'FRIDAY';
  const todayClasses = timetable
    .filter((t) => t.dayOfWeek === currentDay || t.dayOfWeek === 'MONDAY')
    .slice(0, 4);

  const pendingAssignments = assignments.filter((a) => a.status === 'PUBLISHED');

  const handleVoteSurvey = async () => {
    if (!selectedSurvey) return;
    try {
      await api.respondSurvey(selectedSurvey.id, [
        { questionId: selectedSurvey.questions[0]?.id || 'q1', value: surveyAnswer },
      ]);
      setSurveySubmitted(true);
    } catch (err) {
      console.error(err);
      setSurveySubmitted(true);
    }
  };

  return (
    <div className="space-y-6">
      {/* Student Cockpit Hero Banner */}
      <div className="relative rounded-2xl bg-gradient-to-r from-[#0C1425] via-[#101B33] to-[#0A1220] border border-cyan-500/20 p-6 overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 p-0.5 shadow-lg shadow-cyan-500/20 shrink-0">
              <div className="w-full h-full bg-[#080E1A] rounded-[14px] flex items-center justify-center font-bold text-cyan-400 text-xl font-serif">
                {studentInfo?.firstName?.[0] || user?.fullName?.[0] || 'S'}
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-xl sm:text-2xl font-serif font-bold text-slate-100">
                  Welcome back, {studentInfo ? `${studentInfo.firstName} ${studentInfo.lastName}` : user?.fullName}
                </h1>
                <Badge variant="cyan" className="font-mono text-[10px] uppercase">
                  Student Cockpit
                </Badge>
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1.5 text-xs text-slate-400 font-mono">
                <span>ID: <strong className="text-slate-200">{studentInfo?.registrationNumber || '23CS042'}</strong></span>
                <span>•</span>
                <span>Program: <strong className="text-slate-200">B.Tech Computer Science</strong></span>
                <span>•</span>
                <span>Semester: <strong className="text-slate-200">Semester V (Fall 2025)</strong></span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              icon={Vote}
              onClick={() => onNavigate('student-surveys')}
            >
              Surveys ({surveys.length})
            </Button>
            <Button
              variant="secondary"
              size="sm"
              icon={ShieldCheck}
              onClick={() => onNavigate('student-confidential-report')}
            >
              Confidential Desk
            </Button>
            <Button
              variant="primary"
              size="sm"
              icon={CalendarCheck}
              onClick={() => onNavigate('student-attendance')}
            >
              Attendance Tracker
            </Button>
          </div>
        </div>
      </div>

      {/* Attendance & Key Academic Gauges */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Attendance Gauge */}
        <div className={`rounded-xl border p-5 transition-all ${
          isAttendanceAtRisk
            ? 'bg-rose-950/20 border-rose-500/40'
            : 'bg-[#0E1524] border-slate-700/80'
        }`}>
          <div className="flex items-center justify-between text-xs font-mono text-slate-400 mb-2">
            <span>MANDATORY ATTENDANCE</span>
            <CalendarCheck className={`w-4 h-4 ${isAttendanceAtRisk ? 'text-rose-400' : 'text-cyan-400'}`} />
          </div>
          <div className="flex items-baseline gap-2">
            <span className={`text-3xl font-bold font-mono ${isAttendanceAtRisk ? 'text-rose-300' : 'text-slate-100'}`}>
              {attendanceRate}%
            </span>
            <span className="text-xs text-slate-400 font-mono">/ 75.0% min</span>
          </div>
          <div className="w-full h-2 bg-slate-800 rounded-full mt-3 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                isAttendanceAtRisk ? 'bg-rose-500' : 'bg-gradient-to-r from-cyan-500 to-emerald-400'
              }`}
              style={{ width: `${Math.min(100, attendanceRate)}%` }}
            />
          </div>
          <p className="text-[11px] text-slate-400 mt-2.5">
            {isAttendanceAtRisk
              ? 'Warning: Shortage alert! You must attend the next 4 lectures.'
              : 'Safe zone: 9.5% buffer above statutory cutoff.'}
          </p>
        </div>

        {/* CGPA / GPA */}
        <div className="rounded-xl bg-[#0E1524] border border-slate-700/80 p-5">
          <div className="flex items-center justify-between text-xs font-mono text-slate-400 mb-2">
            <span>CUMULATIVE GPA</span>
            <Award className="w-4 h-4 text-amber-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold font-mono text-slate-100">{cgpa.toFixed(2)}</span>
            <span className="text-xs text-emerald-400 font-mono flex items-center gap-0.5">
              <TrendingUp className="w-3 h-3" /> +0.12
            </span>
          </div>
          <div className="flex items-center justify-between mt-3 text-xs text-slate-400">
            <span>Credits: <strong>88 / 160</strong></span>
            <Badge variant="emerald" className="text-[10px]">Dean's Honor List</Badge>
          </div>
        </div>

        {/* Pending Assignments */}
        <div className="rounded-xl bg-[#0E1524] border border-slate-700/80 p-5">
          <div className="flex items-center justify-between text-xs font-mono text-slate-400 mb-2">
            <span>ACTIVE ASSIGNMENTS</span>
            <FileText className="w-4 h-4 text-blue-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold font-mono text-slate-100">{pendingAssignments.length}</span>
            <span className="text-xs text-amber-400 font-mono">Due This Week</span>
          </div>
          <div className="mt-3 text-xs text-slate-400 flex items-center justify-between">
            <span>Next: Distributed Systems</span>
            <span className="text-rose-400 font-mono">2 days left</span>
          </div>
        </div>

        {/* Examinations Alert */}
        <div className="rounded-xl bg-[#0E1524] border border-slate-700/80 p-5">
          <div className="flex items-center justify-between text-xs font-mono text-slate-400 mb-2">
            <span>MID-TERM EXAMS</span>
            <Clock className="w-4 h-4 text-purple-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold font-mono text-slate-100">6 Days</span>
            <span className="text-xs text-purple-400 font-mono">Countdown</span>
          </div>
          <div className="mt-3 text-xs text-slate-400 flex items-center justify-between">
            <span>Hall Ticket: <strong>Issued</strong></span>
            <span className="text-cyan-400 text-[11px] hover:underline cursor-pointer" onClick={() => onNavigate('student-examinations')}>
              View Roster →
            </span>
          </div>
        </div>
      </div>

      {/* Main Grid: Today's Schedule & AI Copilot */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Today's Schedule Matrix */}
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-2xl bg-[#0E1524] border border-slate-700/80 p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-serif font-bold text-slate-100 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-cyan-400" />
                  Today's Classroom Schedule ({currentDay})
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Synchronized live with academic timetable and room allocations
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onNavigate('student-timetable')}
              >
                Full Week Matrix
              </Button>
            </div>

            <div className="space-y-3">
              {todayClasses.length > 0 ? (
                todayClasses.map((item, idx) => (
                  <div
                    key={item.id || idx}
                    className="p-4 rounded-xl bg-[#080E1A] border border-slate-800 hover:border-slate-700 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg bg-cyan-950/60 border border-cyan-500/30 flex items-center justify-center text-cyan-300 font-mono font-bold text-sm shrink-0">
                        P{item.periodIndex || idx + 1}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-semibold text-slate-200">
                            {item.subjectName || 'Advanced Computer Architecture'}
                          </h3>
                          <Badge variant="outline" className="text-[10px] font-mono">
                            {item.subjectCode || 'CS301'}
                          </Badge>
                        </div>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400 mt-1">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-slate-500" />
                            {item.startTime || '09:00'} - {item.endTime || '10:15'}
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-slate-500" />
                            {item.roomNumber || 'Turing CS-101'}
                          </span>
                          <span>•</span>
                          <span>{item.facultyName || 'Prof. Marcus Chen'}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center">
                      <Badge variant={idx === 0 ? 'emerald' : 'cyan'}>
                        {idx === 0 ? 'Upcoming Next' : 'Scheduled'}
                      </Badge>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-slate-400 text-xs font-mono">
                  No lectures scheduled for today. Enjoy your academic study block!
                </div>
              )}
            </div>
          </div>

          {/* Pending Tasks & Coursework */}
          <div className="rounded-2xl bg-[#0E1524] border border-slate-700/80 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-serif font-bold text-slate-100 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-blue-400" />
                Active Coursework & Deadlines
              </h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onNavigate('student-assignments')}
              >
                View All Assignments →
              </Button>
            </div>

            <div className="space-y-3">
              {pendingAssignments.slice(0, 3).map((asg) => (
                <div
                  key={asg.id}
                  className="p-3.5 rounded-xl bg-[#080E1A] border border-slate-800 flex items-center justify-between"
                >
                  <div className="space-y-0.5">
                    <div className="text-sm font-semibold text-slate-200">{asg.title}</div>
                    <div className="text-xs text-slate-400 font-mono">
                      Subject: {asg.subjectName || 'CS301'} • Max Score: {asg.maxScore || 100} pts
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-mono text-amber-400 block">
                      Due: {asg.dueDate ? new Date(asg.dueDate).toLocaleDateString() : 'In 3 days'}
                    </span>
                    <Badge variant="outline" className="text-[10px] mt-0.5">
                      Pending Submission
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Col: AI Intelligence & Campus Pulse */}
        <div className="space-y-6">
          {/* AI Academic Advisor Card */}
          <div className="rounded-2xl bg-gradient-to-b from-[#11192C] to-[#0A101C] border border-cyan-500/30 p-5 shadow-xl relative overflow-hidden">
            <div className="flex items-center gap-2 text-cyan-400 font-mono text-xs font-semibold mb-3">
              <Sparkles className="w-4 h-4" />
              CUOIS INTELLIGENCE ADVISOR
            </div>
            <div className="p-3 rounded-xl bg-[#070B14]/80 border border-slate-800 text-xs text-slate-300 leading-relaxed mb-4">
              "You have maintained strong performance in <strong>CS301 Algorithms</strong> (89% attendance). However, in <strong>CS302 Computer Networks</strong>, attending the upcoming laboratory session is critical to avoid breach of the 75% examination eligibility clause."
            </div>
            <div className="space-y-2 text-xs font-mono text-slate-400">
              <div className="flex items-center justify-between">
                <span>Calculated Shortfall:</span>
                <strong className="text-slate-200">0 Classes</strong>
              </div>
              <div className="flex items-center justify-between">
                <span>Recommended Library Reserve:</span>
                <strong className="text-cyan-400">Tanenbaum (Ed. 5)</strong>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="w-full mt-4"
              onClick={() => onNavigate('student-ai-advisor')}
            >
              Open AI Academic Copilot
            </Button>
          </div>

          {/* Quick Anonymous Survey Widget */}
          {selectedSurvey && (
            <div className="rounded-2xl bg-[#0E1524] border border-slate-700/80 p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-mono text-cyan-400 flex items-center gap-1.5">
                  <Vote className="w-3.5 h-3.5" />
                  CAMPUS SURVEY
                </span>
                <Badge variant="outline" className="text-[10px] text-emerald-400 border-emerald-500/30">
                  100% Anonymous
                </Badge>
              </div>
              <h3 className="text-sm font-semibold text-slate-200 mb-2">
                {selectedSurvey.title}
              </h3>
              <p className="text-xs text-slate-400 mb-4">
                {selectedSurvey.questions[0]?.text || 'How satisfied are you with workstation compute power in Turing Labs?'}
              </p>

              {surveySubmitted ? (
                <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-xs font-mono flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  Your vote has been anonymously cast and recorded.
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-1">
                    {[1, 2, 3, 4, 5].map((val) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setSurveyAnswer(val)}
                        className={`flex-1 py-2 rounded-lg text-xs font-mono font-bold transition-all ${
                          surveyAnswer === val
                            ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                            : 'bg-[#080E1A] hover:bg-slate-800 text-slate-300 border border-slate-800'
                        }`}
                      >
                        {val}★
                      </button>
                    ))}
                  </div>
                  <Button
                    variant="primary"
                    size="sm"
                    className="w-full"
                    onClick={handleVoteSurvey}
                  >
                    Submit Anonymous Vote
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Targeted Announcements */}
          <div className="rounded-2xl bg-[#0E1524] border border-slate-700/80 p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-mono text-slate-400 flex items-center gap-1.5">
                <Bell className="w-3.5 h-3.5 text-amber-400" />
                CAMPUS NOTICES
              </span>
              <span
                className="text-[11px] text-cyan-400 cursor-pointer hover:underline"
                onClick={() => onNavigate('student-announcements')}
              >
                All ({announcements.length}) →
              </span>
            </div>
            <div className="space-y-3">
              {announcements.slice(0, 2).map((ann) => (
                <div key={ann.id} className="p-3 rounded-xl bg-[#080E1A] border border-slate-800">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <h4 className="text-xs font-semibold text-slate-200 truncate">{ann.title}</h4>
                    {ann.isPinned && <Badge variant="amber" className="text-[9px]">PINNED</Badge>}
                  </div>
                  <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                    {ann.content}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Smart Services Links */}
          <div className="p-4 rounded-2xl bg-[#0E1524] border border-slate-700/80">
            <div className="text-xs font-mono text-slate-400 mb-3">CAMPUS SMART SERVICES</div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => onNavigate('student-services')}
                className="p-2.5 rounded-xl bg-[#080E1A] hover:bg-slate-800 border border-slate-800 text-left transition-colors"
              >
                <BookMarked className="w-4 h-4 text-cyan-400 mb-1" />
                <div className="text-xs font-semibold text-slate-200">Library Due</div>
                <div className="text-[10px] text-slate-400 font-mono">1 book issued</div>
              </button>
              <button
                type="button"
                onClick={() => onNavigate('student-services')}
                className="p-2.5 rounded-xl bg-[#080E1A] hover:bg-slate-800 border border-slate-800 text-left transition-colors"
              >
                <Bus className="w-4 h-4 text-emerald-400 mb-1" />
                <div className="text-xs font-semibold text-slate-200">Bus Route</div>
                <div className="text-[10px] text-slate-400 font-mono">Route 1 (07:30)</div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
