import React, { useState, useEffect } from 'react';
import { CalendarCheck, AlertTriangle, CheckCircle2, XCircle, Clock, UserCheck, Send, Filter } from 'lucide-react';
import { api } from '../../lib/api.ts';
import { Student, Subject, Section, AttendanceStatus } from '../../types/index.ts';
import { Button } from '../ui/button.tsx';
import { Select, Input } from '../ui/input.tsx';
import { Badge } from '../ui/badge.tsx';
import { Card } from '../ui/card.tsx';

export const AttendanceView: React.FC = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedSection, setSelectedSection] = useState('sec_cs_3a');
  const [selectedSubject, setSelectedSubject] = useState('subj_algo');

  // Attendance state: studentId -> status
  const [attendanceMap, setAttendanceMap] = useState<Record<string, AttendanceStatus>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Tab: 'marking' | 'shortage'
  const [activeTab, setActiveTab] = useState<'marking' | 'shortage'>('marking');

  useEffect(() => {
    (async () => {
      try {
        const [stu, sub, sec] = await Promise.all([
          api.getStudents(),
          api.getSubjects(),
          api.getSections(),
        ]);
        setStudents(stu);
        setSubjects(sub);
        setSections(sec);

        // Pre-fill attendance map with PRESENT
        const initialMap: Record<string, AttendanceStatus> = {};
        stu.forEach((s) => {
          initialMap[s.id] = 'PRESENT';
        });
        setAttendanceMap(initialMap);
        setIsLoading(false);
      } catch (err) {
        console.error(err);
        setIsLoading(false);
      }
    })();
  }, []);

  const handleStatusChange = (studentId: string, status: AttendanceStatus) => {
    setAttendanceMap((prev) => ({ ...prev, [studentId]: status }));
  };

  const markAll = (status: AttendanceStatus) => {
    const updated: Record<string, AttendanceStatus> = {};
    students.forEach((s) => {
      updated[s.id] = status;
    });
    setAttendanceMap(updated);
  };

  const handleSubmitAttendance = async () => {
    setIsSubmitting(true);
    setSuccessMessage(null);
    try {
      const records = students.map((s) => ({
        studentId: s.id,
        studentName: s.fullName,
        subjectId: selectedSubject,
        subjectName: subjects.find((sub) => sub.id === selectedSubject)?.name || 'Subject',
        sectionId: selectedSection,
        sectionName: sections.find((sec) => sec.id === selectedSection)?.name || 'A',
        facultyId: 'fac_1',
        facultyName: 'Dr. Elena Rostova',
        date,
        status: attendanceMap[s.id] || 'PRESENT',
        markedAt: new Date().toISOString(),
      }));

      const res = await api.recordAttendance(records);
      setSuccessMessage(`Successfully registered ${res.count} attendance records for ${date}.`);
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: any) {
      alert(err.message || 'Failed to submit attendance records');
    } finally {
      setIsSubmitting(false);
    }
  };

  const lowAttendanceStudents = students.filter((s) => s.attendancePercentage < 75);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-serif font-bold text-slate-100 flex items-center gap-2">
            <CalendarCheck className="w-5 h-5 text-cyan-400" />
            Attendance Automation Engine
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time daily session recording with automated shortage calculations and guardian dispatch.
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center p-1 rounded-xl bg-[#0A101C] border border-slate-800">
          <button
            onClick={() => setActiveTab('marking')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              activeTab === 'marking'
                ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Mark Session
          </button>
          <button
            onClick={() => setActiveTab('shortage')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 ${
              activeTab === 'shortage'
                ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>Shortage Watchlist</span>
            {lowAttendanceStudents.length > 0 && (
              <Badge variant="danger" size="sm">
                {lowAttendanceStudents.length}
              </Badge>
            )}
          </button>
        </div>
      </div>

      {successMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-xs font-mono flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {activeTab === 'marking' ? (
        <div className="space-y-4">
          {/* Controls Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-[#0A101C] p-4 rounded-xl border border-slate-800">
            <div>
              <Input
                label="Instructional Date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            <div>
              <Select
                label="Course Subject"
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                options={subjects.map((sub) => ({ value: sub.id, label: `${sub.code} - ${sub.name}` }))}
              />
            </div>
            <div>
              <Select
                label="Target Section"
                value={selectedSection}
                onChange={(e) => setSelectedSection(e.target.value)}
                options={sections.map((sec) => ({ value: sec.id, label: `Section ${sec.name}` }))}
              />
            </div>
            <div className="flex flex-col justify-end">
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1"
                  onClick={() => markAll('PRESENT')}
                >
                  All Present
                </Button>
                <Button
                  size="sm"
                  variant="primary"
                  className="flex-1"
                  isLoading={isSubmitting}
                  onClick={handleSubmitAttendance}
                >
                  Save Batch
                </Button>
              </div>
            </div>
          </div>

          {/* Student Roster Table */}
          <div className="rounded-xl border border-slate-800/80 bg-[#0A101C] overflow-hidden">
            <div className="p-3 bg-[#0E1524] border-b border-slate-800 text-xs font-mono text-slate-400 flex items-center justify-between">
              <span>ACTIVE COHORT ROSTER ({students.length} ENROLLED)</span>
              <span>TOGGLE ATTENDANCE STATUS</span>
            </div>
            <div className="divide-y divide-slate-800/50">
              {students.map((student) => {
                const currentStatus = attendanceMap[student.id] || 'PRESENT';
                return (
                  <div
                    key={student.id}
                    className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-900/40 transition-colors"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-slate-200">{student.fullName}</span>
                        <span className="text-[10px] font-mono text-cyan-400">
                          ({student.registrationNumber})
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        Current Aggregate: {student.attendancePercentage}%{' '}
                        {student.attendancePercentage < 75 && (
                          <span className="text-rose-400 font-semibold">• Critical Shortage</span>
                        )}
                      </div>
                    </div>

                    {/* Status Pill Toggle Buttons */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleStatusChange(student.id, 'PRESENT')}
                        className={`px-3 py-1 rounded-lg text-xs font-medium font-mono transition-all ${
                          currentStatus === 'PRESENT'
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40 shadow-[0_0_10px_rgba(16,185,129,0.2)]'
                            : 'bg-[#0E1524] text-slate-400 border border-slate-800 hover:text-slate-200'
                        }`}
                      >
                        PRESENT
                      </button>
                      <button
                        type="button"
                        onClick={() => handleStatusChange(student.id, 'ABSENT')}
                        className={`px-3 py-1 rounded-lg text-xs font-medium font-mono transition-all ${
                          currentStatus === 'ABSENT'
                            ? 'bg-rose-950 text-rose-300 border border-rose-500/40 shadow-[0_0_10px_rgba(244,63,94,0.2)]'
                            : 'bg-[#0E1524] text-slate-400 border border-slate-800 hover:text-slate-200'
                        }`}
                      >
                        ABSENT
                      </button>
                      <button
                        type="button"
                        onClick={() => handleStatusChange(student.id, 'LATE')}
                        className={`px-3 py-1 rounded-lg text-xs font-medium font-mono transition-all ${
                          currentStatus === 'LATE'
                            ? 'bg-amber-950 text-amber-300 border border-amber-500/40'
                            : 'bg-[#0E1524] text-slate-400 border border-slate-800 hover:text-slate-200'
                        }`}
                      >
                        LATE
                      </button>
                      <button
                        type="button"
                        onClick={() => handleStatusChange(student.id, 'EXCUSED')}
                        className={`px-3 py-1 rounded-lg text-xs font-medium font-mono transition-all ${
                          currentStatus === 'EXCUSED'
                            ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/40'
                            : 'bg-[#0E1524] text-slate-400 border border-slate-800 hover:text-slate-200'
                        }`}
                      >
                        EXCUSED
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        /* Shortage Analysis View */
        <div className="space-y-4">
          <Card
            title="Attendance Shortage & Admit Card Risk"
            subtitle="Students falling below statutory 75% institutional requirement"
            icon={AlertTriangle}
          >
            {lowAttendanceStudents.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400 font-mono">
                No students currently in attendance shortfall.
              </div>
            ) : (
              <div className="divide-y divide-slate-800/60">
                {lowAttendanceStudents.map((s) => (
                  <div key={s.id} className="py-4 flex items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-slate-100">{s.fullName}</span>
                        <span className="text-[10px] font-mono text-slate-400">({s.registrationNumber})</span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1">
                        {s.departmentName} • Guardian: {s.guardianName} ({s.guardianEmail})
                      </p>
                      <div className="mt-2 flex items-center gap-2">
                        <span className="text-[10px] font-mono text-rose-400 uppercase">Risk Level: HIGH</span>
                        <span className="text-slate-600 text-[10px]">•</span>
                        <span className="text-[10px] font-mono text-slate-400">
                          Deficit: {(75 - s.attendancePercentage).toFixed(1)}% to reach quota
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <Badge variant="danger" size="md">
                        {s.attendancePercentage}% Attendance
                      </Badge>
                      <Button
                        size="sm"
                        variant="secondary"
                        icon={Send}
                        onClick={() => alert(`Official alert dispatched to guardian: ${s.guardianEmail}`)}
                      >
                        Send Alert
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  );
};
