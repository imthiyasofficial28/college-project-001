import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  ShieldCheck,
  CheckCircle2,
  TrendingDown,
  CalendarCheck,
  Award,
  Filter,
  Search,
  Send,
  UserX,
  FileText,
  Users,
} from 'lucide-react';
import { api } from '../../lib/api.ts';
import { StudentRiskIndicator } from '../../types/index.ts';
import { Badge } from '../ui/badge.tsx';
import { Button } from '../ui/button.tsx';
import { Input, Select } from '../ui/input.tsx';

export const StudentRiskView: React.FC = () => {
  const [indicators, setIndicators] = useState<StudentRiskIndicator[]>([]);
  const [filteredIndicators, setFilteredIndicators] = useState<StudentRiskIndicator[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [riskFilter, setRiskFilter] = useState<'ALL' | 'RED' | 'YELLOW' | 'GREEN'>('ALL');
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadIndicators();
  }, []);

  const loadIndicators = async () => {
    try {
      const data = await api.getStudentRiskIndicators();
      setIndicators(data);
      setFilteredIndicators(data);
    } catch (err) {
      console.error('Failed to load risk indicators', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let result = indicators;

    if (riskFilter !== 'ALL') {
      result = result.filter((i) => i.riskLevel === riskFilter);
    }

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      result = result.filter(
        (i) =>
          i.studentName.toLowerCase().includes(q) ||
          i.registrationNumber.toLowerCase().includes(q) ||
          i.departmentName.toLowerCase().includes(q)
      );
    }

    setFilteredIndicators(result);
  }, [indicators, riskFilter, searchTerm]);

  const handleDispatchAdvisory = (student: StudentRiskIndicator) => {
    setActionSuccessMsg(
      `Statutory academic advisory notice dispatched to ${student.studentName} (${student.registrationNumber}). Parent copy forwarded.`
    );
    setTimeout(() => setActionSuccessMsg(null), 4000);
  };

  const redCount = indicators.filter((i) => i.riskLevel === 'RED').length;
  const yellowCount = indicators.filter((i) => i.riskLevel === 'YELLOW').length;
  const greenCount = indicators.filter((i) => i.riskLevel === 'GREEN').length;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="relative rounded-2xl bg-gradient-to-r from-[#1E1210] via-[#241512] to-[#120B0A] border border-rose-500/30 p-6 shadow-2xl overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-rose-950/80 border border-rose-500/40 flex items-center justify-center text-rose-400 shrink-0">
              <AlertTriangle className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-xl sm:text-2xl font-serif font-bold text-slate-100">
                  Student Academic Risk Intelligence & Early Warning
                </h1>
                <Badge variant="rose" className="font-mono text-[10px]">
                  RETENTION & INTERVENTION ENGINE
                </Badge>
              </div>
              <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
                Automated multi-factor risk radar synthesizing class attendance shortfall, coursework submission rates, and GPA velocity to flag scholars before academic penalty occurs.
              </p>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-[#080E1A] border border-rose-500/40 text-center">
              <span className="text-xs font-mono text-rose-400 block font-bold">RED RISK</span>
              <span className="text-xl font-bold font-mono text-slate-100">{redCount}</span>
            </div>
            <div className="p-3 rounded-xl bg-[#080E1A] border border-amber-500/40 text-center">
              <span className="text-xs font-mono text-amber-400 block font-bold">YELLOW</span>
              <span className="text-xl font-bold font-mono text-slate-100">{yellowCount}</span>
            </div>
            <div className="p-3 rounded-xl bg-[#080E1A] border border-emerald-500/40 text-center">
              <span className="text-xs font-mono text-emerald-400 block font-bold">GREEN</span>
              <span className="text-xl font-bold font-mono text-slate-100">{greenCount}</span>
            </div>
          </div>
        </div>
      </div>

      {actionSuccessMsg && (
        <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-xs font-mono flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          {actionSuccessMsg}
        </div>
      )}

      {/* Filter Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-[#0E1524] border border-slate-700/80">
        <div className="flex items-center gap-2 w-full sm:w-80">
          <Input
            placeholder="Search student by name, reg number, department..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-slate-400">Risk Filter:</span>
          {(['ALL', 'RED', 'YELLOW', 'GREEN'] as const).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRiskFilter(r)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
                riskFilter === r
                  ? r === 'RED'
                    ? 'bg-rose-600 text-white'
                    : r === 'YELLOW'
                    ? 'bg-amber-600 text-white'
                    : r === 'GREEN'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-cyan-500 text-slate-950'
                  : 'bg-[#080E1A] text-slate-400 border border-slate-800 hover:text-slate-200'
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* Risk Table */}
      <div className="rounded-2xl bg-[#0E1524] border border-slate-700/80 p-5 space-y-4">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-800 text-slate-400 font-mono">
              <tr>
                <th className="py-3 px-3">Student / Reg #</th>
                <th className="py-3 px-3">Department & Section</th>
                <th className="py-3 px-3">Risk Level</th>
                <th className="py-3 px-3">Attendance Rate</th>
                <th className="py-3 px-3">Assignment Rate</th>
                <th className="py-3 px-3">CGPA</th>
                <th className="py-3 px-3">Contributing Factors</th>
                <th className="py-3 px-3 text-right">Intervention Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {filteredIndicators.map((item) => {
                const isRed = item.riskLevel === 'RED';
                const isYellow = item.riskLevel === 'YELLOW';
                return (
                  <tr
                    key={item.studentId}
                    className={`hover:bg-slate-800/40 transition-colors ${
                      isRed ? 'bg-rose-950/10' : isYellow ? 'bg-amber-950/10' : ''
                    }`}
                  >
                    <td className="py-3 px-3">
                      <span className="font-sans font-bold text-slate-100 block">{item.studentName}</span>
                      <span className="text-[11px] text-cyan-400">{item.registrationNumber}</span>
                    </td>

                    <td className="py-3 px-3 text-slate-300">
                      <div>{item.departmentName}</div>
                      <div className="text-[11px] text-slate-500">{item.sectionName}</div>
                    </td>

                    <td className="py-3 px-3">
                      <Badge
                        variant={isRed ? 'rose' : isYellow ? 'amber' : 'emerald'}
                        className="font-bold text-[10px]"
                      >
                        {item.riskLevel}
                      </Badge>
                    </td>

                    <td className="py-3 px-3">
                      <span className={`font-bold ${isRed ? 'text-rose-400' : isYellow ? 'text-amber-400' : 'text-slate-200'}`}>
                        {item.attendancePercentage}%
                      </span>
                      <span className="text-[10px] text-slate-500 block">Cutoff: 75%</span>
                    </td>

                    <td className="py-3 px-3 text-slate-200">
                      {item.assignmentCompletionRate}%
                    </td>

                    <td className="py-3 px-3 text-slate-200 font-bold">
                      {item.cgpa.toFixed(2)}
                    </td>

                    <td className="py-3 px-3 max-w-xs font-sans text-xs">
                      <ul className="list-disc list-inside space-y-0.5 text-slate-400">
                        {item.riskFactors.map((f, i) => (
                          <li key={i} className="line-clamp-1">{f}</li>
                        ))}
                      </ul>
                    </td>

                    <td className="py-3 px-3 text-right">
                      {item.riskLevel !== 'GREEN' ? (
                        <Button
                          variant="secondary"
                          size="sm"
                          icon={Send}
                          className={isRed ? 'border-rose-500/40 text-rose-300 hover:bg-rose-950/40' : ''}
                          onClick={() => handleDispatchAdvisory(item)}
                        >
                          Send Advisory
                        </Button>
                      ) : (
                        <span className="text-[11px] text-emerald-400 flex items-center justify-end gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Optimal Standing
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
