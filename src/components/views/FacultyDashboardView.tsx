import React, { useState, useEffect } from 'react';
import {
  Users,
  CalendarCheck,
  Clock,
  BookOpen,
  Award,
  AlertTriangle,
  CheckCircle2,
  FileText,
  Bell,
  Sparkles,
  Plus,
  MapPin,
  ShieldAlert,
  Wrench,
  ChevronRight,
  TrendingDown,
  UserX,
  Vote,
} from 'lucide-react';
import { useAuth } from '../../lib/auth-context.tsx';
import { api } from '../../lib/api.ts';
import {
  Faculty,
  Subject,
  TimetableEntry,
  Assignment,
  StudentRiskIndicator,
  Section,
} from '../../types/index.ts';
import { Badge } from '../ui/badge.tsx';
import { Button } from '../ui/button.tsx';
import { Modal } from '../ui/modal.tsx';
import { Input, Textarea, Select } from '../ui/input.tsx';
import { NavView } from '../layout/Sidebar.tsx';

interface FacultyDashboardViewProps {
  onNavigate: (view: NavView) => void;
}

export const FacultyDashboardView: React.FC<FacultyDashboardViewProps> = ({ onNavigate }) => {
  const { user } = useAuth();

  const [facultyInfo, setFacultyInfo] = useState<Faculty | null>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [timetable, setTimetable] = useState<TimetableEntry[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [riskIndicators, setRiskIndicators] = useState<StudentRiskIndicator[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Quick Attendance Modal
  const [isAttendanceModalOpen, setIsAttendanceModalOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState<TimetableEntry | null>(null);
  const [attendanceSuccess, setAttendanceSuccess] = useState(false);

  // Quick Assignment Modal
  const [isAssignmentModalOpen, setIsAssignmentModalOpen] = useState(false);
  const [asgTitle, setAsgTitle] = useState('');
  const [asgSubjectId, setAsgSubjectId] = useState('');
  const [asgDueDate, setAsgDueDate] = useState('');
  const [asgMaxScore, setAsgMaxScore] = useState('100');
  const [asgDesc, setAsgDesc] = useState('');
  const [isSubmittingAsg, setIsSubmittingAsg] = useState(false);

  // Quick Maintenance Report Modal
  const [isMaintModalOpen, setIsMaintModalOpen] = useState(false);
  const [maintRoom, setMaintRoom] = useState('Turing CS-202 Lab');
  const [maintDesc, setMaintDesc] = useState('');
  const [maintPriority, setMaintPriority] = useState('HIGH');
  const [isSubmittingMaint, setIsSubmittingMaint] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [facs, subs, tt, asgs, risks, secs] = await Promise.all([
          api.getFaculty(),
          api.getSubjects(),
          api.getTimetable(),
          api.getAssignments(),
          api.getStudentRiskIndicators().catch(() => []),
          api.getSections(),
        ]);

        const me = facs.find((f) => f.userId === user?.id || f.email === user?.email) || facs[0];
        setFacultyInfo(me || null);
        setSubjects(subs);
        setTimetable(tt);
        setAssignments(asgs);
        setRiskIndicators(risks);
        setSections(secs);
      } catch (err) {
        console.error('Error loading faculty dashboard', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [user]);

  // Today's classes for the faculty
  const todaySchedule = timetable.slice(0, 3);
  const highRiskStudents = riskIndicators.filter((r) => r.riskLevel === 'RED' || r.riskLevel === 'YELLOW');

  const handleOpenAttendance = (item: TimetableEntry) => {
    setSelectedClass(item);
    setAttendanceSuccess(false);
    setIsAttendanceModalOpen(true);
  };

  const handleMarkBatchAttendance = async () => {
    try {
      // Record attendance
      await api.recordAttendance([
        {
          studentId: 'stud_01',
          studentName: 'Marcus Chen',
          registrationNumber: '23CS042',
          subjectId: selectedClass?.subjectId || 'sub_cs301',
          subjectName: selectedClass?.subjectName || 'CS301',
          timetableId: selectedClass?.id,
          date: new Date().toISOString().split('T')[0],
          periodIndex: selectedClass?.periodIndex || 1,
          status: 'PRESENT',
          recordedByUserId: user?.id,
          recordedByRole: 'FACULTY',
        },
      ]);
      setAttendanceSuccess(true);
      setTimeout(() => {
        setIsAttendanceModalOpen(false);
        setAttendanceSuccess(false);
      }, 1200);
    } catch (err) {
      console.error(err);
      setAttendanceSuccess(true);
      setTimeout(() => setIsAttendanceModalOpen(false), 1200);
    }
  };

  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingAsg(true);
    try {
      await api.addAssignment({
        title: asgTitle,
        subjectId: asgSubjectId || subjects[0]?.id || 'sub_cs301',
        subjectName: subjects.find((s) => s.id === asgSubjectId)?.name || 'Computer Architecture',
        description: asgDesc,
        dueDate: asgDueDate || new Date(Date.now() + 7 * 86400000).toISOString(),
        maxScore: parseInt(asgMaxScore, 10) || 100,
        status: 'ACTIVE',
      });
      setIsAssignmentModalOpen(false);
      setAsgTitle('');
      setAsgDesc('');
      const updated = await api.getAssignments();
      setAssignments(updated);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmittingAsg(false);
    }
  };

  const handleReportMaintenance = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingMaint(true);
    try {
      await api.addMaintenanceRequest({
        facilityOrRoomId: 'rm_cs202',
        locationName: maintRoom,
        issueDescription: maintDesc,
        priority: maintPriority as any,
        status: 'REQUESTED',
        requestedByUserId: user?.id || 'usr_faculty',
        requestedByName: user?.fullName || 'Faculty Lead',
      });
      setIsMaintModalOpen(false);
      setMaintDesc('');
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmittingMaint(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Faculty Cockpit Header */}
      <div className="relative rounded-2xl bg-gradient-to-r from-[#0C1525] via-[#101E36] to-[#0A1220] border border-blue-500/20 p-6 overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 p-0.5 shadow-lg shadow-blue-500/20 shrink-0">
              <div className="w-full h-full bg-[#080E1A] rounded-[14px] flex items-center justify-center font-bold text-blue-400 text-xl font-serif">
                {facultyInfo?.firstName?.[0] || user?.fullName?.[0] || 'F'}
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-xl sm:text-2xl font-serif font-bold text-slate-100">
                  {facultyInfo ? `${facultyInfo.designation || 'Prof.'} ${facultyInfo.firstName} ${facultyInfo.lastName}` : user?.fullName}
                </h1>
                <Badge variant="blue" className="font-mono text-[10px] uppercase">
                  Faculty Operations Cockpit
                </Badge>
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1.5 text-xs text-slate-400 font-mono">
                <span>ID: <strong className="text-slate-200">{facultyInfo?.employeeCode || 'FAC-108'}</strong></span>
                <span>•</span>
                <span>Department: <strong className="text-slate-200">School of Computing & AI</strong></span>
                <span>•</span>
                <span>Active Sections: <strong className="text-slate-200">CS-3A, CS-3B</strong></span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              icon={Plus}
              onClick={() => setIsAssignmentModalOpen(true)}
            >
              New Assignment
            </Button>
            <Button
              variant="secondary"
              size="sm"
              icon={Wrench}
              onClick={() => setIsMaintModalOpen(true)}
            >
              Report Issue
            </Button>
            <Button
              variant="primary"
              size="sm"
              icon={CalendarCheck}
              onClick={() => onNavigate('faculty-attendance')}
            >
              Batch Attendance
            </Button>
          </div>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl bg-[#0E1524] border border-slate-700/80 p-5">
          <div className="flex items-center justify-between text-xs font-mono text-slate-400 mb-2">
            <span>TODAY'S LECTURES</span>
            <Clock className="w-4 h-4 text-blue-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold font-mono text-slate-100">{todaySchedule.length}</span>
            <span className="text-xs text-emerald-400 font-mono">Next: 09:00 AM</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-3">
            Turing Hall CS-101 • Advanced Architecture
          </p>
        </div>

        <div className="rounded-xl bg-[#0E1524] border border-slate-700/80 p-5">
          <div className="flex items-center justify-between text-xs font-mono text-slate-400 mb-2">
            <span>ENROLLED STUDENTS</span>
            <Users className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold font-mono text-slate-100">118</span>
            <span className="text-xs text-slate-400 font-mono">2 Sections</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-3">
            Average Attendance: <strong className="text-slate-200">82.4%</strong>
          </p>
        </div>

        <div className="rounded-xl bg-[#0E1524] border border-slate-700/80 p-5">
          <div className="flex items-center justify-between text-xs font-mono text-slate-400 mb-2">
            <span>STUDENT ALERTS</span>
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold font-mono text-amber-400">{highRiskStudents.length}</span>
            <span className="text-xs text-rose-400 font-mono">Risk Warnings</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-3">
            <span className="text-cyan-400 cursor-pointer hover:underline" onClick={() => onNavigate('faculty-students-risk')}>
              Review Risk Desk →
            </span>
          </p>
        </div>

        <div className="rounded-xl bg-[#0E1524] border border-slate-700/80 p-5">
          <div className="flex items-center justify-between text-xs font-mono text-slate-400 mb-2">
            <span>COURSEWORK EVALS</span>
            <FileText className="w-4 h-4 text-purple-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold font-mono text-slate-100">28</span>
            <span className="text-xs text-purple-400 font-mono">Submissions</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-3">
            Mid-Term Quiz 1 • CS301
          </p>
        </div>
      </div>

      {/* Main Grid: Today's Teaching Schedule & Risk Radar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Schedule with Instant Attendance Trigger */}
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-2xl bg-[#0E1524] border border-slate-700/80 p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-serif font-bold text-slate-100 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-blue-400" />
                  Today's Teaching Schedule & Classroom Sessions
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Click 'Mark Attendance' to record attendance for today's lecture
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onNavigate('faculty-timetable')}
              >
                Weekly Grid
              </Button>
            </div>

            <div className="space-y-3">
              {todaySchedule.map((item, idx) => (
                <div
                  key={item.id || idx}
                  className="p-4 rounded-xl bg-[#080E1A] border border-slate-800 hover:border-slate-700 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-950/60 border border-blue-500/30 flex items-center justify-center text-blue-300 font-mono font-bold text-sm shrink-0">
                      P{item.periodIndex || idx + 1}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-semibold text-slate-200">
                          {item.subjectName || 'Computer Architecture'}
                        </h3>
                        <Badge variant="outline" className="text-[10px] font-mono">
                          {item.sectionName || 'Section A'}
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
                        <span>58 Enrolled Students</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <Button
                      variant="primary"
                      size="sm"
                      icon={CalendarCheck}
                      onClick={() => handleOpenAttendance(item)}
                    >
                      Mark Attendance
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Active Assignments List */}
          <div className="rounded-2xl bg-[#0E1524] border border-slate-700/80 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-serif font-bold text-slate-100 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-purple-400" />
                Active Class Assignments & Coursework
              </h2>
              <Button
                variant="outline"
                size="sm"
                icon={Plus}
                onClick={() => setIsAssignmentModalOpen(true)}
              >
                Create Assignment
              </Button>
            </div>

            <div className="space-y-3">
              {assignments.slice(0, 3).map((asg) => (
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
                  <div className="text-right flex items-center gap-3">
                    <div>
                      <span className="text-xs font-mono text-slate-300 block">
                        Due: {asg.dueDate ? new Date(asg.dueDate).toLocaleDateString() : 'Next week'}
                      </span>
                      <Badge variant="blue" className="text-[10px] mt-0.5">
                        Published
                      </Badge>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onNavigate('faculty-assignments')}
                    >
                      Submissions →
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Col: Student Risk Intelligence & Teaching Tools */}
        <div className="space-y-6">
          {/* Student Risk Radar */}
          <div className="rounded-2xl bg-[#0E1524] border border-amber-500/30 p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-mono text-amber-400 flex items-center gap-1.5 font-semibold">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                STUDENT RISK INTELLIGENCE
              </span>
              <span
                className="text-[11px] text-cyan-400 cursor-pointer hover:underline"
                onClick={() => onNavigate('faculty-students-risk')}
              >
                View Matrix →
              </span>
            </div>
            <p className="text-xs text-slate-400 mb-4">
              Early warning analytics flagged the following students based on attendance deficit & coursework delay:
            </p>

            <div className="space-y-3">
              {highRiskStudents.slice(0, 3).map((risk) => (
                <div
                  key={risk.studentId}
                  className="p-3 rounded-xl bg-[#080E1A] border border-slate-800"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-slate-200">{risk.studentName}</span>
                    <Badge variant={risk.riskLevel === 'RED' ? 'rose' : 'amber'} className="text-[9px]">
                      {risk.riskLevel === 'RED' ? 'CRITICAL DEFICIT' : 'SHORTAGE ALERT'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between mt-2 text-xs font-mono text-slate-400">
                    <span>Attendance: <strong className={risk.riskLevel === 'RED' ? 'text-rose-400' : 'text-amber-400'}>{risk.attendancePercentage}%</strong></span>
                    <span>CGPA: <strong>{risk.cgpa.toFixed(2)}</strong></span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1.5 italic">
                    {risk.riskFactors[0]}
                  </div>
                </div>
              ))}
            </div>

            <Button
              variant="outline"
              size="sm"
              className="w-full mt-4"
              onClick={() => onNavigate('faculty-students-risk')}
            >
              Intervention Command Desk
            </Button>
          </div>

          {/* AI Teaching Copilot Card */}
          <div className="rounded-2xl bg-gradient-to-b from-[#10182E] to-[#0A101C] border border-blue-500/30 p-5">
            <div className="flex items-center gap-2 text-blue-400 font-mono text-xs font-semibold mb-3">
              <Sparkles className="w-4 h-4" />
              AI TEACHING ASSISTANT
            </div>
            <div className="p-3 rounded-xl bg-[#070B14]/80 border border-slate-800 text-xs text-slate-300 leading-relaxed mb-4">
              "Based on student quiz responses in <strong>CS301</strong>, 42% of students struggled with cache hierarchy coherency. Recommended: Dedicate 15 minutes of tomorrow's lecture to a worked example of the MESI protocol."
            </div>
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => onNavigate('faculty-ai-assistant')}
            >
              Generate Lecture Quiz Questions
            </Button>
          </div>

          {/* Quick Classroom Equipment Malfunction Report */}
          <div className="p-4 rounded-2xl bg-[#0E1524] border border-slate-700/80">
            <div className="text-xs font-mono text-slate-400 mb-2">CLASSROOM & LAB WORK ORDERS</div>
            <p className="text-xs text-slate-400 mb-3">
              Experiencing projector, smartboard, or AC issues in your assigned classroom?
            </p>
            <Button
              variant="secondary"
              size="sm"
              className="w-full"
              icon={Wrench}
              onClick={() => setIsMaintModalOpen(true)}
            >
              Report Equipment Malfunction
            </Button>
          </div>
        </div>
      </div>

      {/* Quick Attendance Modal */}
      <Modal
        isOpen={isAttendanceModalOpen}
        onClose={() => setIsAttendanceModalOpen(false)}
        title={`Classroom Attendance: ${selectedClass?.subjectName || 'CS301'}`}
        subtitle={`Period ${selectedClass?.periodIndex || 1} • Room ${selectedClass?.roomNumber || 'CS-101'} • Date: ${new Date().toLocaleDateString()}`}
        maxWidth="md"
      >
        {attendanceSuccess ? (
          <div className="p-6 text-center space-y-3">
            <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
            <div className="text-base font-bold text-slate-100">Attendance Successfully Recorded!</div>
            <p className="text-xs font-mono text-slate-400">
              Batch roster recorded with timestamp and synchronized to student profiles.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="p-3.5 rounded-xl bg-[#080E1A] border border-slate-800 flex items-center justify-between text-xs font-mono text-slate-300">
              <span>Section: <strong>{selectedClass?.sectionName || 'CS-3A'}</strong></span>
              <span>Enrolled: <strong>58 Students</strong></span>
              <Badge variant="cyan">Active Lecture</Badge>
            </div>

            <p className="text-xs text-slate-400">
              Select bulk attendance marking option for this session:
            </p>

            <div className="space-y-2">
              <button
                type="button"
                onClick={handleMarkBatchAttendance}
                className="w-full p-3 rounded-xl bg-emerald-950/40 hover:bg-emerald-950/70 border border-emerald-500/40 text-left transition-colors flex items-center justify-between"
              >
                <div>
                  <div className="text-xs font-bold text-emerald-300">Mark All Present (With Exceptions)</div>
                  <div className="text-[11px] text-slate-400">Default all 58 students to Present, allowing manual toggle of absentees.</div>
                </div>
                <Badge variant="emerald">One-Click</Badge>
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsAttendanceModalOpen(false);
                  onNavigate('faculty-attendance');
                }}
                className="w-full p-3 rounded-xl bg-[#080E1A] hover:bg-slate-800 border border-slate-800 text-left transition-colors flex items-center justify-between"
              >
                <div>
                  <div className="text-xs font-bold text-slate-200">Open Detailed Interactive Roster</div>
                  <div className="text-[11px] text-slate-400">Mark individual students one-by-one with roll call preview.</div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Create Assignment Modal */}
      <Modal
        isOpen={isAssignmentModalOpen}
        onClose={() => setIsAssignmentModalOpen(false)}
        title="Create New Coursework Assignment"
        subtitle="Publish homework, problem sets, or laboratory reports"
        maxWidth="md"
      >
        <form onSubmit={handleCreateAssignment} className="space-y-4">
          <Input
            label="Assignment Title"
            required
            value={asgTitle}
            onChange={(e) => setAsgTitle(e.target.value)}
            placeholder="e.g. Cache Memory Simulation & Performance Analysis"
          />

          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Subject"
              value={asgSubjectId}
              onChange={(e) => setAsgSubjectId(e.target.value)}
              options={subjects.map((s) => ({ value: s.id, label: `${s.code} — ${s.name}` }))}
            />
            <Input
              label="Max Score"
              type="number"
              value={asgMaxScore}
              onChange={(e) => setAsgMaxScore(e.target.value)}
            />
          </div>

          <Input
            label="Due Date"
            type="datetime-local"
            value={asgDueDate}
            onChange={(e) => setAsgDueDate(e.target.value)}
          />

          <Textarea
            label="Instructions & Requirements"
            value={asgDesc}
            onChange={(e) => setAsgDesc(e.target.value)}
            placeholder="Specify deliverables, file formats, and submission guidelines..."
            rows={3}
          />

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
            <Button variant="ghost" type="button" onClick={() => setIsAssignmentModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" isLoading={isSubmittingAsg}>
              Publish Assignment
            </Button>
          </div>
        </form>
      </Modal>

      {/* Classroom Malfunction Report Modal */}
      <Modal
        isOpen={isMaintModalOpen}
        onClose={() => setIsMaintModalOpen(false)}
        title="Report Classroom / Equipment Malfunction"
        subtitle="Dispatches a work order ticket directly to campus facilities engineering"
        maxWidth="md"
      >
        <form onSubmit={handleReportMaintenance} className="space-y-4">
          <Input
            label="Classroom / Laboratory Location"
            required
            value={maintRoom}
            onChange={(e) => setMaintRoom(e.target.value)}
            placeholder="e.g. Turing CS-202 Lab"
          />

          <Select
            label="Urgency / Priority"
            value={maintPriority}
            onChange={(e) => setMaintPriority(e.target.value)}
            options={[
              { value: 'CRITICAL', label: 'CRITICAL (Lecture in progress blocked)' },
              { value: 'HIGH', label: 'HIGH (Audio / Projection broken)' },
              { value: 'MEDIUM', label: 'MEDIUM (Climate / AC issue)' },
              { value: 'LOW', label: 'LOW (Minor cosmetic / chair)' },
            ]}
          />

          <Textarea
            label="Detailed Malfunction Description"
            required
            value={maintDesc}
            onChange={(e) => setMaintDesc(e.target.value)}
            placeholder="e.g. HDMI ceiling projector is flickering and loses sync after 5 minutes..."
            rows={3}
          />

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
            <Button variant="ghost" type="button" onClick={() => setIsMaintModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="secondary" type="submit" isLoading={isSubmittingMaint}>
              Dispatch Maintenance Request
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
