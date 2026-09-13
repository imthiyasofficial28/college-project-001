import React, { useState, useEffect } from 'react';
import {
  GraduationCap,
  BookOpen,
  Calendar,
  Award,
  Clock,
  Download,
  CheckCircle2,
  FileText,
  BadgePercent,
  TrendingUp,
} from 'lucide-react';
import { api } from '../../lib/api.ts';
import { Subject, Examination, ExamSchedule, Result, Assignment } from '../../types/index.ts';
import { Badge } from '../ui/badge.tsx';
import { Button } from '../ui/button.tsx';

type AcademicsTab = 'SUBJECTS' | 'EXAMINATIONS' | 'RESULTS' | 'ASSIGNMENTS';

export const StudentAcademicsView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AcademicsTab>('SUBJECTS');
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [exams, setExams] = useState<Examination[]>([]);
  const [schedules, setSchedules] = useState<ExamSchedule[]>([]);
  const [results, setResults] = useState<Result[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadAcademicData = async () => {
      try {
        const [subs, exList, schList, resList, asgList] = await Promise.all([
          api.getSubjects(),
          api.getExaminations(),
          api.getExamSchedules(),
          api.getResults(),
          api.getAssignments(),
        ]);
        setSubjects(subs);
        setExams(exList);
        setSchedules(schList);
        setResults(resList);
        setAssignments(asgList);
      } catch (err) {
        console.error('Error loading student academics', err);
      } finally {
        setIsLoading(false);
      }
    };
    loadAcademicData();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl bg-[#0E1524] border border-slate-700/80">
        <div>
          <div className="flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-cyan-400" />
            <h1 className="text-xl sm:text-2xl font-serif font-bold text-slate-100">
              Academic Curriculum, Coursework & Evaluations
            </h1>
            <Badge variant="cyan" className="font-mono text-[10px]">
              SEMESTER V • B.TECH CS
            </Badge>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Enrolled course units, syllabus progress, examination hall tickets, and certified academic transcripts.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            icon={Download}
            onClick={() => alert('Official Grade Sheet & Examination Hall Ticket PDF downloaded.')}
          >
            Download Hall Ticket
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-xl bg-[#080E1A] border border-slate-800">
        {[
          { id: 'SUBJECTS' as AcademicsTab, label: `Enrolled Courses (${subjects.length})`, icon: BookOpen },
          { id: 'EXAMINATIONS' as AcademicsTab, label: `Examination Schedules (${schedules.length})`, icon: Calendar },
          { id: 'RESULTS' as AcademicsTab, label: `Certified Marks & Grades (${results.length})`, icon: Award },
          { id: 'ASSIGNMENTS' as AcademicsTab, label: `Assignments Portal (${assignments.length})`, icon: FileText },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-mono font-semibold transition-all ${
                isActive
                  ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab 1: Enrolled Courses */}
      {activeTab === 'SUBJECTS' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {subjects.map((sub, idx) => (
            <div
              key={sub.id}
              className="p-5 rounded-2xl bg-[#0E1524] border border-slate-700/80 hover:border-slate-600 transition-all flex flex-col justify-between space-y-4"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Badge variant="cyan" className="font-mono text-xs">
                    {sub.code}
                  </Badge>
                  <span className="text-xs font-mono text-slate-400">{sub.credits} Credits</span>
                </div>
                <h3 className="text-base font-bold text-slate-100">{sub.name}</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Prof. Lead: <strong className="text-slate-300">Faculty Chair</strong>
                </p>
              </div>

              <div className="space-y-2 pt-3 border-t border-slate-800">
                <div className="flex justify-between text-xs font-mono text-slate-400">
                  <span>Syllabus Covered:</span>
                  <strong className="text-slate-200">{70 + (idx * 5)}%</strong>
                </div>
                <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-cyan-500 rounded-full"
                    style={{ width: `${70 + (idx * 5)}%` }}
                  />
                </div>
                <div className="flex justify-between text-[11px] font-mono text-slate-500 pt-1">
                  <span>Internal Assessment: Safe</span>
                  <span className="text-cyan-400">Syllabus PDF →</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab 2: Examination Schedules */}
      {activeTab === 'EXAMINATIONS' && (
        <div className="rounded-2xl bg-[#0E1524] border border-slate-700/80 p-6 space-y-4">
          <div>
            <h2 className="text-base font-serif font-bold text-slate-100">
              End-Semester Examination Window
            </h2>
            <p className="text-xs text-slate-400">
              Verified Hall Ticket allocations and examination room venues
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-800 text-slate-400 font-mono">
                <tr>
                  <th className="py-3 px-3">Date</th>
                  <th className="py-3 px-3">Time Window</th>
                  <th className="py-3 px-3">Course Code & Name</th>
                  <th className="py-3 px-3">Assigned Hall</th>
                  <th className="py-3 px-3">Seat #</th>
                  <th className="py-3 px-3">Clearance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {schedules.map((sch, i) => (
                  <tr key={sch.id || i} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-3 text-cyan-400 font-bold">{sch.examDate}</td>
                    <td className="py-3 px-3 text-slate-300">{sch.startTime} - {sch.endTime}</td>
                    <td className="py-3 px-3 text-slate-200 font-sans font-medium">{sch.subjectName}</td>
                    <td className="py-3 px-3 text-slate-300">{sch.roomNumber}</td>
                    <td className="py-3 px-3 text-amber-400">SEAT-{(i + 1) * 12}</td>
                    <td className="py-3 px-3">
                      <Badge variant="emerald" className="text-[10px]">VERIFIED</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Certified Marks & Grades */}
      {activeTab === 'RESULTS' && (
        <div className="rounded-2xl bg-[#0E1524] border border-slate-700/80 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-serif font-bold text-slate-100">
                Official Marks & Performance History
              </h2>
              <p className="text-xs text-slate-400">
                Continuous internal assessments and semester grade sheets
              </p>
            </div>
            <Badge variant="emerald">CGPA: 3.84 / 4.00</Badge>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-800 text-slate-400 font-mono">
                <tr>
                  <th className="py-3 px-3">Course Code</th>
                  <th className="py-3 px-3">Marks Obtained</th>
                  <th className="py-3 px-3">Max Marks</th>
                  <th className="py-3 px-3">Percentage</th>
                  <th className="py-3 px-3">Letter Grade</th>
                  <th className="py-3 px-3">Result</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {results.map((res, i) => (
                  <tr key={res.id || i} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-3 text-cyan-400 font-bold">{res.subjectId || 'CS301'}</td>
                    <td className="py-3 px-3 text-slate-100 font-bold">{res.marksObtained}</td>
                    <td className="py-3 px-3 text-slate-400">{res.maxMarks}</td>
                    <td className="py-3 px-3 text-slate-300">
                      {Math.round((res.marksObtained / res.maxMarks) * 100)}%
                    </td>
                    <td className="py-3 px-3 font-bold text-emerald-400">{res.grade}</td>
                    <td className="py-3 px-3">
                      <Badge variant="emerald" className="text-[10px]">{res.status}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 4: Assignments */}
      {activeTab === 'ASSIGNMENTS' && (
        <div className="rounded-2xl bg-[#0E1524] border border-slate-700/80 p-6 space-y-4">
          <div>
            <h2 className="text-base font-serif font-bold text-slate-100">
              Assignments & Problem Sets
            </h2>
            <p className="text-xs text-slate-400">
              Submit coursework solutions and view faculty evaluation feedback
            </p>
          </div>

          <div className="space-y-3">
            {assignments.map((asg) => (
              <div
                key={asg.id}
                className="p-4 rounded-xl bg-[#080E1A] border border-slate-800 hover:border-slate-700 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-slate-200">{asg.title}</h3>
                    <Badge variant="outline" className="text-[10px] font-mono">{asg.subjectName || 'CS301'}</Badge>
                  </div>
                  <p className="text-xs text-slate-400 mt-1 max-w-xl">{asg.description}</p>
                </div>

                <div className="flex items-center gap-3 self-end sm:self-center">
                  <div className="text-right">
                    <span className="text-xs font-mono text-amber-400 block">
                      Due: {asg.dueDate ? new Date(asg.dueDate).toLocaleDateString() : 'Next week'}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">Max: {asg.maxScore} pts</span>
                  </div>
                  <Button variant="primary" size="sm">
                    Submit Work
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
