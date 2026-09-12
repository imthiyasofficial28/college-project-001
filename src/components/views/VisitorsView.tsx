import React, { useState, useEffect } from 'react';
import { UserCheck, Plus, Clock, MapPin, CheckCircle2, User, Phone } from 'lucide-react';
import { api } from '../../lib/api.ts';
import { Visitor } from '../../types/index.ts';
import { Button } from '../ui/button.tsx';
import { Input } from '../ui/input.tsx';
import { Badge } from '../ui/badge.tsx';
import { Modal } from '../ui/modal.tsx';
import { Table } from '../ui/table.tsx';

export const VisitorsView: React.FC = () => {
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // New Visitor Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [purpose, setPurpose] = useState('');
  const [personToMeet, setPersonToMeet] = useState('');
  const [entryGate, setEntryGate] = useState('Gate 1 (Main)');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadVisitors = async () => {
    try {
      const data = await api.getVisitors();
      setVisitors(data);
      setIsLoading(false);
    } catch (err) {
      console.error(err);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadVisitors();
  }, []);

  const handleRegisterVisitor = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await api.registerVisitor({
        fullName,
        contactNumber: phone,
        purpose: (purpose || 'OFFICIAL') as any,
        hostName: personToMeet,
        status: 'CHECKED_IN',
      });
      setIsModalOpen(false);
      setFullName('');
      setPhone('');
      setPurpose('');
      setPersonToMeet('');
      await loadVisitors();
    } catch (err: any) {
      alert(err.message || 'Failed to register visitor');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCheckout = async (id: string) => {
    try {
      await api.checkoutVisitor(id);
      await loadVisitors();
    } catch (err: any) {
      alert(err.message || 'Failed to check out visitor');
    }
  };

  const columns = [
    {
      key: 'passNumber',
      header: 'Pass ID',
      render: (v: Visitor) => (
        <span className="font-mono text-cyan-400 font-semibold text-xs">{v.passNumber}</span>
      ),
    },
    {
      key: 'fullName',
      header: 'Visitor Details',
      render: (v: Visitor) => (
        <div>
          <div className="font-semibold text-slate-100 text-xs">{v.fullName}</div>
          <div className="text-[11px] text-slate-400">{v.contactNumber}</div>
        </div>
      ),
    },
    {
      key: 'purpose',
      header: 'Purpose & Host',
      render: (v: Visitor) => (
        <div>
          <div className="text-xs text-slate-200">{v.purpose.replace('_', ' ')}</div>
          <div className="text-[10px] text-slate-400 font-mono">Host: {v.hostName}</div>
        </div>
      ),
    },
    {
      key: 'entryTimestamp',
      header: 'Entry Point & Time',
      render: (v: Visitor) => (
        <div>
          <div className="text-xs text-slate-300 font-mono">
            {new Date(v.entryTimestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
          <div className="text-[10px] text-slate-500 font-mono">Gate Clearance</div>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Current Status',
      render: (v: Visitor) => (
        <Badge variant={v.status === 'CHECKED_IN' ? 'warning' : 'neutral'} size="sm" dot>
          {v.status === 'CHECKED_IN' ? 'ON CAMPUS' : v.status}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: 'Gate Action',
      align: 'right' as const,
      render: (v: Visitor) =>
        v.status === 'CHECKED_IN' ? (
          <Button size="sm" variant="outline" onClick={() => handleCheckout(v.id)}>
            Checkout Gate
          </Button>
        ) : (
          <span className="text-[11px] text-slate-500 font-mono">Cleared</span>
        ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-serif font-bold text-slate-100 flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-cyan-400" />
            Gate Access & Visitor Pass Protocol
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Perimeter entry logs, escort designations, and exit clearance timestamps.
          </p>
        </div>
        <Button variant="primary" size="sm" icon={Plus} onClick={() => setIsModalOpen(true)}>
          Issue Visitor Pass
        </Button>
      </div>

      <Table columns={columns} data={visitors} keyExtractor={(v) => v.id} isLoading={isLoading} />

      {/* New Pass Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Issue Gate Visitor Pass"
        subtitle="Registers external guest entry into campus security database"
        maxWidth="md"
      >
        <form onSubmit={handleRegisterVisitor} className="space-y-4">
          <Input
            label="Visitor Full Name"
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="e.g. Rachel Adams"
          />

          <Input
            label="Phone Contact"
            required
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+1 (555) 349-1029"
          />

          <Input
            label="Purpose of Visit"
            required
            value={purpose}
            onChange={(e) => setPurpose(e.target.value)}
            placeholder="e.g. Guest Lecture / Vendor Inspection"
          />

          <Input
            label="Host / Person to Meet"
            required
            value={personToMeet}
            onChange={(e) => setPersonToMeet(e.target.value)}
            placeholder="e.g. Dr. Elena Rostova"
          />

          <Input
            label="Gate Access Point"
            required
            value={entryGate}
            onChange={(e) => setEntryGate(e.target.value)}
            placeholder="Gate 1 (Main)"
          />

          <div className="pt-4 border-t border-slate-800 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isSubmitting}>
              Issue Pass & Print Badge
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
