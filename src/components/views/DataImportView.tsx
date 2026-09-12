import React, { useState } from 'react';
import {
  FileSpreadsheet,
  Upload,
  Download,
  CheckCircle2,
  AlertCircle,
  FileJson,
  Database,
  ArrowRight,
} from 'lucide-react';
import { api } from '../../lib/api.ts';
import { Button } from '../ui/button.tsx';
import { Select } from '../ui/input.tsx';
import { Badge } from '../ui/badge.tsx';

export const DataImportView: React.FC = () => {
  const [entityType, setEntityType] = useState('STUDENTS');
  const [importText, setImportText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [importResult, setImportResult] = useState<{
    createdCount: number;
    updatedCount: number;
    errors: string[];
  } | null>(null);

  const sampleStudentsCSV = `fullName,email,registrationNumber,departmentId,departmentName,programId,programName,currentSemester,sectionName,cgpa,attendancePercentage,feeStatus
Zane Thorne,zane.thorne@student.apexhorizon.edu,STU-2025-0010,dept_cs,Computer Science & Engineering,prog_cs_btech,B.Tech CSE,3,A,3.82,94,PAID
Aria Montgomery,aria.m@student.apexhorizon.edu,STU-2025-0011,dept_cs,Computer Science & Engineering,prog_cs_btech,B.Tech CSE,3,A,3.45,82,PAID
Kavita Patel,kavita.p@student.apexhorizon.edu,STU-2025-0012,dept_ece,Electronics & Communication,prog_ece_btech,B.Tech ECE,5,B,3.91,96,PAID`;

  const sampleFacultyCSV = `fullName,email,employeeId,departmentId,departmentName,designation,specialization,cabinLocation
Dr. Liam Zhang,liam.zhang@apexhorizon.edu,FAC-2025-0004,dept_cs,Computer Science & Engineering,Associate Professor,Distributed Systems & Cloud,Turing Hall 304
Dr. Sophia Morales,sophia.m@apexhorizon.edu,FAC-2025-0005,dept_mech,Mechanical Engineering,Professor,Robotics & Aerodynamics,Curie Hall 102`;

  const parseCsvToJson = (csv: string): any[] => {
    const lines = csv.trim().split('\n');
    if (lines.length < 2) return [];
    const headers = lines[0].split(',').map((h) => h.trim());
    return lines.slice(1).map((line) => {
      const values = line.split(',').map((v) => v.trim());
      const obj: any = {};
      headers.forEach((h, i) => {
        let val: any = values[i];
        if (h === 'cgpa' || h === 'attendancePercentage' || h === 'currentSemester') {
          val = Number(val);
        }
        obj[h] = val;
      });
      return obj;
    });
  };

  const handleImport = async () => {
    if (!importText.trim()) {
      alert('Please paste CSV or JSON records to import.');
      return;
    }
    setIsProcessing(true);
    setImportResult(null);

    try {
      let records: any[] = [];
      const trimmed = importText.trim();
      if (trimmed.startsWith('[')) {
        records = JSON.parse(trimmed);
      } else {
        records = parseCsvToJson(trimmed);
      }

      if (records.length === 0) {
        throw new Error('No valid records parsed from input.');
      }

      const res = await api.importData(entityType, records, 'CREATE_UPDATE');
      setImportResult({
        createdCount: res.createdCount,
        updatedCount: res.updatedCount,
        errors: res.errors || [],
      });
    } catch (err: any) {
      alert(err.message || 'Import failed. Check formatting.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleExportFullDatabase = async () => {
    try {
      const data = await api.exportData();
      const jsonStr = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `CUOIS_Campus_Backup_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      alert(err.message || 'Export failed');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-serif font-bold text-slate-100 flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-cyan-400" />
            Institutional Ingestion & Sovereign Data Export
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Bulk CSV/JSON data onboarding with automatic duplicate resolution and complete sovereign JSON backup.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          icon={Download}
          onClick={handleExportFullDatabase}
        >
          Export Full Campus Backup (JSON)
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Import Console */}
        <div className="lg:col-span-2 space-y-4 bg-[#0A101C] p-5 rounded-xl border border-slate-800">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
            <div className="w-64">
              <Select
                label="Select Target Entity"
                value={entityType}
                onChange={(e) => setEntityType(e.target.value)}
                options={[
                  { value: 'STUDENTS', label: 'Students Roster' },
                  { value: 'FACULTY', label: 'Faculty & Academic Staff' },
                  { value: 'LIBRARY_ITEMS', label: 'Library Catalog Books' },
                  { value: 'BUILDINGS', label: 'Campus Buildings' },
                ]}
              />
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() =>
                  setImportText(entityType === 'STUDENTS' ? sampleStudentsCSV : sampleFacultyCSV)
                }
                className="text-xs font-mono text-cyan-400 hover:underline"
              >
                Load Sample CSV Template
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 font-mono">
              Raw CSV or JSON Payload
            </label>
            <textarea
              rows={10}
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              placeholder="Paste comma-separated CSV with headers or a JSON array of records..."
              className="w-full bg-[#0E1524] border border-slate-700 rounded-xl p-3 text-xs text-slate-100 font-mono placeholder:text-slate-500 focus:outline-none focus:border-cyan-400 leading-relaxed"
            />
          </div>

          <div className="flex items-center justify-between pt-2">
            <span className="text-[11px] font-mono text-slate-500">
              Supports bulk insert and deterministic update on primary key match.
            </span>
            <Button
              variant="primary"
              size="md"
              icon={Upload}
              isLoading={isProcessing}
              onClick={handleImport}
            >
              Execute Ingestion Engine
            </Button>
          </div>

          {/* Result Alert */}
          {importResult && (
            <div className="mt-4 p-4 rounded-xl bg-[#0E1524] border border-emerald-500/30 space-y-2 animate-in fade-in">
              <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 font-mono">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Ingestion Pipeline Completed Successfully</span>
              </div>
              <div className="flex items-center gap-4 text-xs font-mono text-slate-300">
                <span>New Records Created: <strong className="text-cyan-400">{importResult.createdCount}</strong></span>
                <span>Existing Records Updated: <strong className="text-emerald-400">{importResult.updatedCount}</strong></span>
              </div>
              {importResult.errors.length > 0 && (
                <div className="pt-2 border-t border-slate-800 text-xs text-rose-400 font-mono space-y-1">
                  <span className="font-bold">Errors encountered:</span>
                  {importResult.errors.map((err, i) => (
                    <div key={i}>• {err}</div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Instructions & Sovereign Backup Card */}
        <div className="space-y-4">
          <div className="bg-[#0A101C] p-5 rounded-xl border border-slate-800 space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-200 uppercase font-mono">
              <Database className="w-4 h-4 text-cyan-400" />
              <span>Data Sovereignty Guidelines</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              CUOIS does not rely on third-party cloud lock-in. All relational entities (Academics, Facilities, Security, Logs) are persisted in the local container volume.
            </p>
            <div className="p-3 rounded-lg bg-[#0E1524] border border-slate-800 text-[11px] font-mono text-slate-300 space-y-1">
              <div>• Instant single-file JSON backup</div>
              <div>• Full relational foreign key integrity</div>
              <div>• Atomic safe writes with rollback</div>
            </div>
          </div>

          <div className="bg-[#0A101C] p-5 rounded-xl border border-slate-800 space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-200 uppercase font-mono">
              <FileJson className="w-4 h-4 text-emerald-400" />
              <span>Bulk Ingestion Schemas</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Ensure column headers match required keys. Invalid rows will be reported with row numbers without halting the remaining batch.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
