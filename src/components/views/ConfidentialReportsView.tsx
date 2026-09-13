import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Lock,
  Unlock,
  KeyRound,
  FileCheck,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Plus,
  Eye,
  FileText,
  Search,
  Filter,
  ShieldCheck,
  History,
} from 'lucide-react';
import { useAuth } from '../../lib/auth-context.tsx';
import { api } from '../../lib/api.ts';
import { ConfidentialReport } from '../../types/index.ts';
import { Badge } from '../ui/badge.tsx';
import { Button } from '../ui/button.tsx';
import { Modal } from '../ui/modal.tsx';
import { Input, Textarea, Select } from '../ui/input.tsx';

export const ConfidentialReportsView: React.FC = () => {
  const { user, activeRole } = useAuth();
  const isSystemOwner = activeRole === 'SYSTEM_OWNER';

  const [reports, setReports] = useState<ConfidentialReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<ConfidentialReport | null>(null);

  // Submit modal
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [category, setCategory] = useState<'ACADEMIC_INTEGRITY' | 'SAFETY_HAZARD' | 'HARASSMENT' | 'MISCONDUCT' | 'INFRASTRUCTURE'>('ACADEMIC_INTEGRITY');
  const [priority, setPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'>('HIGH');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedTicketCode, setSubmittedTicketCode] = useState<string | null>(null);

  // Decryption modal for System Owner
  const [isDecryptModalOpen, setIsDecryptModalOpen] = useState(false);
  const [decryptingReport, setDecryptingReport] = useState<ConfidentialReport | null>(null);
  const [justificationReason, setJustificationReason] = useState('');
  const [isDecrypting, setIsDecrypting] = useState(false);
  const [decryptError, setDecryptError] = useState<string | null>(null);

  useEffect(() => {
    loadReports();
  }, [user, activeRole]);

  const loadReports = async () => {
    try {
      const data = await api.getConfidentialReports();
      setReports(data);
    } catch (err) {
      console.error('Failed to load confidential reports', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenSubmit = () => {
    setSubmittedTicketCode(null);
    setSubject('');
    setDescription('');
    setIsSubmitModalOpen(true);
  };

  const handleSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const created = await api.submitConfidentialReport({
        category,
        priority,
        subject,
        description,
      });
      setSubmittedTicketCode(created.ticketCode);
      loadReports();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenDecrypt = (report: ConfidentialReport) => {
    setDecryptingReport(report);
    setJustificationReason('');
    setDecryptError(null);
    setIsDecryptModalOpen(true);
  };

  const handleConfirmDecrypt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!decryptingReport) return;
    if (justificationReason.trim().length < 10) {
      setDecryptError('Please provide a legitimate institutional justification of at least 10 characters.');
      return;
    }

    setIsDecrypting(true);
    setDecryptError(null);
    try {
      const updated = await api.revealConfidentialReport(decryptingReport.id, justificationReason);
      setIsDecryptModalOpen(false);
      setDecryptingReport(null);
      // Reload reports to show unmasked details
      await loadReports();
      if (selectedReport?.id === updated.id) {
        setSelectedReport(updated);
      }
    } catch (err: any) {
      setDecryptError(err.message || 'Failed to decrypt confidential report.');
    } finally {
      setIsDecrypting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="relative rounded-2xl bg-gradient-to-r from-[#121024] via-[#1A1633] to-[#0E0C1C] border border-purple-500/30 p-6 shadow-2xl overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-purple-950/80 border border-purple-500/40 flex items-center justify-center text-purple-400 shrink-0">
              <Lock className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-xl sm:text-2xl font-serif font-bold text-slate-100">
                  Confidential Whistleblower & Grievance Portal
                </h1>
                <Badge variant="purple" className="font-mono text-[10px]">
                  END-TO-END CRYPTOGRAPHIC ENCRYPTION
                </Badge>
              </div>
              <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
                A hardened, tamper-evident channel for reporting sensitive misconduct, harassment, safety, or integrity concerns.
                Reporter identities are cryptographically masked. Only the authorized System Owner can decrypt identity upon formal institutional justification.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="primary"
              size="md"
              icon={Plus}
              className="bg-purple-600 hover:bg-purple-500 shadow-purple-600/20"
              onClick={handleOpenSubmit}
            >
              File Confidential Report
            </Button>
          </div>
        </div>
      </div>

      {/* Reports List & Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Reports List */}
        <div className="lg:col-span-7 rounded-2xl bg-[#0E1524] border border-slate-700/80 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-serif font-bold text-slate-100">
                {isSystemOwner ? 'System Owner Confidential Dossier' : 'My Filed Confidential Reports'}
              </h2>
              <p className="text-xs text-slate-400">
                {isSystemOwner
                  ? 'All institutionally filed confidential incidents across departments'
                  : 'Encrypted tracking of reports submitted by your account'}
              </p>
            </div>
            <Badge variant="outline" className="font-mono text-xs">
              {reports.length} Records
            </Badge>
          </div>

          <div className="space-y-3 pt-1">
            {reports.length > 0 ? (
              reports.map((report) => {
                const isSelected = selectedReport?.id === report.id;
                return (
                  <div
                    key={report.id}
                    onClick={() => setSelectedReport(report)}
                    className={`p-4 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#151D33] border-purple-500/50 shadow-md shadow-purple-950/40'
                        : 'bg-[#080E1A] border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-purple-400">
                          {report.ticketCode}
                        </span>
                        <Badge variant="outline" className="text-[10px] font-mono">
                          {report.category}
                        </Badge>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <Badge
                          variant={
                            report.priority === 'CRITICAL'
                              ? 'rose'
                              : report.priority === 'HIGH'
                              ? 'amber'
                              : 'cyan'
                          }
                          className="text-[10px]"
                        >
                          {report.priority}
                        </Badge>
                        <Badge
                          variant={report.status === 'RESOLVED' ? 'emerald' : 'blue'}
                          className="text-[10px]"
                        >
                          {report.status}
                        </Badge>
                      </div>
                    </div>

                    <h3 className="text-sm font-semibold text-slate-200 line-clamp-1 mb-1">
                      {report.subject}
                    </h3>
                    <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed mb-3">
                      {report.description}
                    </p>

                    <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 pt-2 border-t border-slate-800/80">
                      <span className="flex items-center gap-1">
                        {report.reporterRevealed ? (
                          <span className="text-amber-400 flex items-center gap-1">
                            <Unlock className="w-3 h-3" /> Identity Decrypted
                          </span>
                        ) : (
                          <span className="text-purple-400 flex items-center gap-1">
                            <Lock className="w-3 h-3" /> {report.reporterName}
                          </span>
                        )}
                      </span>
                      <span>{new Date(report.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-12 text-slate-500 text-xs font-mono">
                No confidential reports filed. Clean institutional record.
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Selected Report Detail & Decryption Desk */}
        <div className="lg:col-span-5 rounded-2xl bg-[#0E1524] border border-slate-700/80 p-6 flex flex-col justify-between space-y-6">
          {selectedReport ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div>
                  <span className="text-xs font-mono text-purple-400 font-bold">
                    {selectedReport.ticketCode}
                  </span>
                  <div className="text-base font-bold text-slate-100 mt-0.5">
                    {selectedReport.subject}
                  </div>
                </div>
                <Badge variant={selectedReport.reporterRevealed ? 'amber' : 'purple'}>
                  {selectedReport.reporterRevealed ? 'UNMASKED' : 'ENCRYPTED'}
                </Badge>
              </div>

              {/* Cryptographic Protection Banner */}
              <div className={`p-4 rounded-xl border space-y-2 ${
                selectedReport.reporterRevealed
                  ? 'bg-amber-950/30 border-amber-500/40'
                  : 'bg-purple-950/30 border-purple-500/40'
              }`}>
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-300 font-semibold flex items-center gap-1.5">
                    {selectedReport.reporterRevealed ? (
                      <>
                        <Unlock className="w-4 h-4 text-amber-400" />
                        Decrypted Reporter Record
                      </>
                    ) : (
                      <>
                        <Lock className="w-4 h-4 text-purple-400" />
                        Reporter Identity Masked
                      </>
                    )}
                  </span>
                </div>

                {selectedReport.reporterRevealed ? (
                  <div className="text-xs font-mono space-y-1 text-slate-200">
                    <div>Reporter: <strong className="text-amber-300">{selectedReport.reporterName}</strong></div>
                    <div>User ID: <span className="text-slate-400">{selectedReport.reporterUserId}</span></div>
                    <div>Role: <span className="text-slate-400">{selectedReport.reporterRole}</span></div>
                    <div className="text-[11px] text-slate-400 pt-1 border-t border-amber-500/20">
                      Decrypted by: {selectedReport.revealedBy} on {selectedReport.revealedAt ? new Date(selectedReport.revealedAt).toLocaleString() : ''}
                    </div>
                  </div>
                ) : (
                  <div className="text-xs text-slate-400 leading-relaxed">
                    Identity is hashed and locked in the sovereign database. Only System Owner role with formal justification can initiate cryptographic decryption.
                  </div>
                )}
              </div>

              {/* Category & Status Details */}
              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                <div className="p-2.5 rounded-lg bg-[#080E1A] border border-slate-800">
                  <span className="text-slate-400 block text-[10px]">CATEGORY</span>
                  <span className="text-slate-200 font-bold">{selectedReport.category}</span>
                </div>
                <div className="p-2.5 rounded-lg bg-[#080E1A] border border-slate-800">
                  <span className="text-slate-400 block text-[10px]">CURRENT STATUS</span>
                  <span className="text-emerald-400 font-bold">{selectedReport.status}</span>
                </div>
              </div>

              {/* Full Description */}
              <div className="space-y-1.5">
                <span className="text-xs font-mono text-slate-400 uppercase">Incident Description</span>
                <div className="p-3.5 rounded-xl bg-[#080E1A] border border-slate-800 text-xs text-slate-200 leading-relaxed whitespace-pre-line">
                  {selectedReport.description}
                </div>
              </div>

              {/* System Owner Decrypt Action Button */}
              {isSystemOwner && !selectedReport.reporterRevealed && (
                <div className="pt-3 border-t border-slate-800">
                  <Button
                    variant="outline"
                    className="w-full text-amber-400 border-amber-500/40 hover:bg-amber-950/40"
                    icon={KeyRound}
                    onClick={() => handleOpenDecrypt(selectedReport)}
                  >
                    Decrypt Reporter Identity (System Owner Privilege)
                  </Button>
                  <p className="text-[10px] text-slate-500 text-center font-mono mt-2">
                    Action requires formal legal/administrative justification and produces an immutable audit log.
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-24 text-slate-500 text-xs font-mono space-y-2">
              <ShieldAlert className="w-10 h-10 text-slate-600 mx-auto" />
              <div>Select a confidential report from the dossier to inspect details.</div>
            </div>
          )}
        </div>
      </div>

      {/* Submit Confidential Report Modal */}
      <Modal
        isOpen={isSubmitModalOpen}
        onClose={() => setIsSubmitModalOpen(false)}
        title="Submit Confidential Whistleblower Report"
        subtitle="Cryptographically protected submission channel"
        maxWidth="lg"
      >
        {submittedTicketCode ? (
          <div className="p-6 text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-purple-950 border border-purple-500/40 flex items-center justify-center text-purple-400 mx-auto">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-100 font-serif">
              Report Cryptographically Registered
            </h3>
            <p className="text-xs text-slate-300 max-w-md mx-auto leading-relaxed">
              Your confidential report has been sealed with institutional-grade privacy safeguards.
            </p>
            <div className="p-4 rounded-xl bg-[#080E1A] border border-slate-800 inline-block">
              <span className="text-xs font-mono text-slate-400 block mb-1">YOUR TRACKING TICKET CODE</span>
              <span className="text-xl font-bold font-mono text-purple-400">{submittedTicketCode}</span>
            </div>
            <div className="pt-4">
              <Button
                variant="primary"
                onClick={() => setIsSubmitModalOpen(false)}
              >
                Done
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmitReport} className="space-y-4">
            <div className="p-3 rounded-xl bg-purple-950/30 border border-purple-500/30 text-xs text-purple-300 flex items-center gap-2">
              <Lock className="w-4 h-4 shrink-0 text-purple-400" />
              Your identity is masked and protected by automated institutional encryption protocols.
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Select
                label="Incident Category"
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                options={[
                  { value: 'ACADEMIC_INTEGRITY', label: 'Academic Integrity / Exam Malpractice' },
                  { value: 'SAFETY_HAZARD', label: 'Campus Safety Hazard' },
                  { value: 'HARASSMENT', label: 'Harassment / Discrimination' },
                  { value: 'MISCONDUCT', label: 'Administrative / Faculty Misconduct' },
                  { value: 'INFRASTRUCTURE', label: 'Severe Infrastructure Breach' },
                ]}
              />
              <Select
                label="Urgency / Priority"
                value={priority}
                onChange={(e) => setPriority(e.target.value as any)}
                options={[
                  { value: 'CRITICAL', label: 'CRITICAL (Immediate safety threat)' },
                  { value: 'HIGH', label: 'HIGH (Ongoing violation)' },
                  { value: 'MEDIUM', label: 'MEDIUM (Formal grievance)' },
                  { value: 'LOW', label: 'LOW (General inquiry / advisory)' },
                ]}
              />
            </div>

            <Input
              label="Subject Summary"
              required
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g. Uncalibrated High-Voltage Laser in Raman Lab RS-202"
            />

            <Textarea
              label="Factual Account & Details"
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide specific dates, locations, equipment, and observed events without compromising personal safety..."
              rows={5}
            />

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <Button variant="ghost" type="button" onClick={() => setIsSubmitModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" type="submit" isLoading={isSubmitting}>
                Encrypt & Submit Report
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* Decrypt Reporter Identity Modal (System Owner Only) */}
      <Modal
        isOpen={isDecryptModalOpen}
        onClose={() => setIsDecryptModalOpen(false)}
        title="Institutional Reporter Identity Decryption"
        subtitle="System Owner Sovereign Override Protocol"
        maxWidth="md"
      >
        <form onSubmit={handleConfirmDecrypt} className="space-y-4">
          <div className="p-3.5 rounded-xl bg-amber-950/40 border border-amber-500/40 text-amber-200 text-xs leading-relaxed space-y-1">
            <div className="font-bold flex items-center gap-1.5 text-amber-300">
              <AlertTriangle className="w-4 h-4" /> STATUTORY AUDIT NOTICE
            </div>
            <div>
              Decrypting this whistleblower report will record an immutable entry in the institutional Audit Trail with your name, IP address, and stated justification.
            </div>
          </div>

          <div className="text-xs font-mono text-slate-300 p-2.5 rounded-lg bg-[#080E1A] border border-slate-800">
            Ticket: <strong className="text-purple-400">{decryptingReport?.ticketCode}</strong> • {decryptingReport?.subject}
          </div>

          <Textarea
            label="Administrative Justification (Mandatory, min 10 chars)"
            required
            value={justificationReason}
            onChange={(e) => setJustificationReason(e.target.value)}
            placeholder="Specify regulatory, legal, or institutional disciplinary inquiry justification..."
            rows={3}
          />

          {decryptError && (
            <div className="text-xs font-mono text-rose-400 p-2 rounded-lg bg-rose-950/40 border border-rose-500/40">
              {decryptError}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
            <Button variant="ghost" type="button" onClick={() => setIsDecryptModalOpen(false)}>
              Abort
            </Button>
            <Button
              variant="outline"
              type="submit"
              isLoading={isDecrypting}
              className="text-amber-400 border-amber-500/40 hover:bg-amber-950/60"
            >
              Confirm Decryption & Log Audit
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
