import React, { useState, useEffect } from 'react';
import {
  MessageSquareWarning,
  Plus,
  Filter,
  CheckCircle2,
  Clock,
  AlertTriangle,
  User,
  Send,
} from 'lucide-react';
import { api } from '../../lib/api.ts';
import { Complaint, ComplaintCategory, PriorityLevel, ComplaintStatus } from '../../types/index.ts';
import { Button } from '../ui/button.tsx';
import { Input, Select } from '../ui/input.tsx';
import { Badge } from '../ui/badge.tsx';
import { Modal } from '../ui/modal.tsx';

export const ComplaintsView: React.FC = () => {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [filterCategory, setFilterCategory] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [isLoading, setIsLoading] = useState(true);

  // File Grievance Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<ComplaintCategory>('FACILITIES');
  const [priority, setPriority] = useState<PriorityLevel>('MEDIUM');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Status update modal
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [newStatus, setNewStatus] = useState<ComplaintStatus>('IN_PROGRESS');
  const [resolutionNotes, setResolutionNotes] = useState('');

  const loadComplaints = async () => {
    try {
      const c = await api.getComplaints();
      setComplaints(c);
      setIsLoading(false);
    } catch (err) {
      console.error(err);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadComplaints();
  }, []);

  const handleFileComplaint = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await api.addComplaint({
        title,
        category,
        priority,
        description,
        status: 'OPEN',
      });
      setIsModalOpen(false);
      setTitle('');
      setDescription('');
      await loadComplaints();
    } catch (err: any) {
      alert(err.message || 'Failed to file grievance');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateStatus = async () => {
    if (!selectedComplaint) return;
    try {
      await api.updateComplaint(selectedComplaint.id, {
        status: newStatus,
        resolutionNotes: resolutionNotes || undefined,
      });
      setSelectedComplaint(null);
      setResolutionNotes('');
      await loadComplaints();
    } catch (err: any) {
      alert(err.message || 'Failed to update grievance status');
    }
  };

  const filtered = complaints.filter((c) => {
    const matchCat = filterCategory === 'ALL' || c.category === filterCategory;
    const matchStat = filterStatus === 'ALL' || c.status === filterStatus;
    return matchCat && matchStat;
  });

  const priorityVariant = (p: PriorityLevel) => {
    switch (p) {
      case 'CRITICAL':
        return 'danger';
      case 'HIGH':
        return 'warning';
      case 'MEDIUM':
        return 'info';
      case 'LOW':
        return 'neutral';
    }
  };

  const statusVariant = (s: ComplaintStatus) => {
    switch (s) {
      case 'RESOLVED':
      case 'CLOSED':
        return 'success';
      case 'IN_PROGRESS':
        return 'info';
      case 'ASSIGNED':
        return 'warning';
      case 'OPEN':
        return 'neutral';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-serif font-bold text-slate-100 flex items-center gap-2">
            <MessageSquareWarning className="w-5 h-5 text-cyan-400" />
            Institutional Grievance & SLA Resolution Desk
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Transparent tracking for academic appeals, facility hazards, and hostel welfare requests.
          </p>
        </div>
        <Button variant="primary" size="sm" icon={Plus} onClick={() => setIsModalOpen(true)}>
          File New Grievance
        </Button>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-3 bg-[#0A101C] p-3 rounded-xl border border-slate-800">
        <div className="w-48">
          <Select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            options={[
              { value: 'ALL', label: 'All Categories' },
              { value: 'ACADEMIC', label: 'Academic' },
              { value: 'FACILITIES', label: 'Facilities' },
              { value: 'HOSTEL', label: 'Hostel' },
              { value: 'TRANSPORT', label: 'Transport' },
              { value: 'DISCIPLINARY', label: 'Disciplinary' },
              { value: 'OTHER', label: 'Other' },
            ]}
          />
        </div>
        <div className="w-48">
          <Select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            options={[
              { value: 'ALL', label: 'All Statuses' },
              { value: 'OPEN', label: 'Open' },
              { value: 'ASSIGNED', label: 'Assigned' },
              { value: 'IN_PROGRESS', label: 'In Progress' },
              { value: 'RESOLVED', label: 'Resolved' },
              { value: 'CLOSED', label: 'Closed' },
            ]}
          />
        </div>
        <div className="ml-auto text-xs font-mono text-slate-400">
          Showing <span className="text-cyan-400 font-bold">{filtered.length}</span> tickets
        </div>
      </div>

      {/* Tickets List */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-500 font-mono border border-dashed border-slate-800 rounded-xl">
            No grievances matching selected criteria.
          </div>
        ) : (
          filtered.map((item) => (
            <div
              key={item.id}
              className="p-4 rounded-xl bg-[#0A101C] border border-slate-800 hover:border-slate-700 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="space-y-1.5 min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-xs text-cyan-400 font-bold">{item.ticketNumber}</span>
                  <Badge variant={priorityVariant(item.priority)} size="sm">
                    {item.priority}
                  </Badge>
                  <Badge variant="neutral" size="sm">
                    {item.category.replace('_', ' ')}
                  </Badge>
                  <Badge variant={statusVariant(item.status)} size="sm" dot>
                    {item.status.replace('_', ' ')}
                  </Badge>
                </div>
                <h3 className="text-sm font-semibold text-slate-100">{item.title}</h3>
                <p className="text-xs text-slate-400 leading-relaxed max-w-3xl">{item.description}</p>
                <div className="flex flex-wrap items-center gap-4 text-[11px] font-mono text-slate-500 pt-1">
                  <span>Filed by: {item.submittedByName}</span>
                  <span>•</span>
                  <span>Assigned: {item.assignedToName || 'Unassigned'}</span>
                  <span>•</span>
                  <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                </div>
                {item.resolutionNotes && (
                  <div className="mt-2 p-2.5 rounded bg-[#0E1524] border border-emerald-500/20 text-xs text-emerald-300">
                    <span className="font-bold">Resolution Notes: </span>
                    {item.resolutionNotes}
                  </div>
                )}
              </div>

              <div className="shrink-0 flex items-center gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    setSelectedComplaint(item);
                    setNewStatus(item.status);
                  }}
                >
                  Manage Ticket
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* File Ticket Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Submit Grievance / Service Request"
        subtitle="Formal entry into institutional SLA tracking registry"
        maxWidth="lg"
      >
        <form onSubmit={handleFileComplaint} className="space-y-4">
          <Input
            label="Brief Subject / Title"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Temperature regulation defect in Turing Lab"
          />

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Grievance Category"
              value={category}
              onChange={(e) => setCategory(e.target.value as ComplaintCategory)}
              options={[
                { value: 'FACILITIES', label: 'Facilities & Buildings' },
                { value: 'ACADEMIC', label: 'Academic & Curriculum' },
                { value: 'HOSTEL', label: 'Hostel & Residence' },
                { value: 'TRANSPORT', label: 'Campus Transport' },
                { value: 'DISCIPLINARY', label: 'Disciplinary & Conduct' },
                { value: 'OTHER', label: 'Other Inquiries' },
              ]}
            />
            <Select
              label="Urgency / Priority"
              value={priority}
              onChange={(e) => setPriority(e.target.value as PriorityLevel)}
              options={[
                { value: 'LOW', label: 'Low (Within 72h)' },
                { value: 'MEDIUM', label: 'Medium (Within 24h)' },
                { value: 'HIGH', label: 'High (Within 6h)' },
                { value: 'CRITICAL', label: 'Critical / Hazard (Immediate)' },
              ]}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 font-mono">
              Detailed Description <span className="text-cyan-400">*</span>
            </label>
            <textarea
              required
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="State the location, symptoms, impact on academic operations, or specific grievances..."
              className="w-full bg-[#090E17] border border-slate-800 rounded-lg p-3 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 font-sans"
            />
          </div>

          <div className="pt-4 border-t border-slate-800 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isSubmitting}>
              Submit Ticket
            </Button>
          </div>
        </form>
      </Modal>

      {/* Manage Ticket Modal */}
      {selectedComplaint && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedComplaint(null)}
          title={`Update Ticket ${selectedComplaint.ticketNumber}`}
          subtitle={selectedComplaint.title}
          maxWidth="md"
        >
          <div className="space-y-4">
            <Select
              label="Ticket Status"
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value as ComplaintStatus)}
              options={[
                { value: 'OPEN', label: 'Open' },
                { value: 'ASSIGNED', label: 'Assigned' },
                { value: 'IN_PROGRESS', label: 'In Progress' },
                { value: 'RESOLVED', label: 'Resolved' },
                { value: 'CLOSED', label: 'Closed' },
              ]}
            />

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 font-mono">
                Official Resolution / Administrative Action Notes
              </label>
              <textarea
                rows={3}
                value={resolutionNotes}
                onChange={(e) => setResolutionNotes(e.target.value)}
                placeholder="Details of technician dispatch, inspection findings, or administrative closure..."
                className="w-full bg-[#090E17] border border-slate-800 rounded-lg p-3 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-cyan-500 font-sans"
              />
            </div>

            <div className="pt-4 border-t border-slate-800 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setSelectedComplaint(null)}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleUpdateStatus}>
                Save Updates
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
