import React, { useState, useEffect } from 'react';
import { Wrench, Plus, CheckCircle2, Clock, AlertTriangle, MapPin, User } from 'lucide-react';
import { api } from '../../lib/api.ts';
import { MaintenanceRequest, PriorityLevel } from '../../types/index.ts';
import { Button } from '../ui/button.tsx';
import { Input, Select } from '../ui/input.tsx';
import { Badge } from '../ui/badge.tsx';
import { Modal } from '../ui/modal.tsx';

export const FacilitiesView: React.FC = () => {
  const [requests, setRequests] = useState<MaintenanceRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // New Work Order Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [locationName, setLocationName] = useState('');
  const [issueDescription, setIssueDescription] = useState('');
  const [priority, setPriority] = useState<PriorityLevel>('MEDIUM');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadRequests = async () => {
    try {
      const data = await api.getMaintenanceRequests();
      setRequests(data);
      setIsLoading(false);
    } catch (err) {
      console.error(err);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, []);

  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await api.addMaintenanceRequest({
        locationName,
        issueDescription,
        priority,
        status: 'REQUESTED',
      });
      setIsModalOpen(false);
      setLocationName('');
      setIssueDescription('');
      await loadRequests();
    } catch (err: any) {
      alert(err.message || 'Failed to dispatch work order');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateStatus = async (id: string, nextStatus: 'REQUESTED' | 'ASSIGNED' | 'IN_PROGRESS' | 'VERIFIED' | 'CLOSED') => {
    try {
      await api.updateMaintenanceRequest(id, {
        status: nextStatus,
      });
      await loadRequests();
    } catch (err: any) {
      alert(err.message || 'Failed to update work order');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-serif font-bold text-slate-100 flex items-center gap-2">
            <Wrench className="w-5 h-5 text-cyan-400" />
            Facilities Operations & Maintenance Work Orders
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Campus physical plant, HVAC automation, electrical systems, and emergency repairs.
          </p>
        </div>
        <Button variant="primary" size="sm" icon={Plus} onClick={() => setIsModalOpen(true)}>
          Dispatch Work Order
        </Button>
      </div>

      {/* Work Orders List */}
      <div className="space-y-3">
        {requests.map((req) => (
          <div
            key={req.id}
            className="p-4 rounded-xl bg-[#0A101C] border border-slate-800 hover:border-slate-700 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
          >
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs text-cyan-400 font-bold">{req.code}</span>
                <Badge
                  variant={req.priority === 'HIGH' || req.priority === 'CRITICAL' ? 'danger' : 'info'}
                  size="sm"
                >
                  {req.priority}
                </Badge>
                <Badge
                  variant={req.status === 'VERIFIED' || req.status === 'CLOSED' ? 'success' : req.status === 'IN_PROGRESS' ? 'warning' : 'neutral'}
                  size="sm"
                  dot
                >
                  {req.status}
                </Badge>
              </div>
              <h3 className="text-sm font-semibold text-slate-100">{req.issueDescription}</h3>
              <div className="flex items-center gap-4 text-[11px] font-mono text-slate-400 pt-1">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-500" /> {req.locationName}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <User className="w-3.5 h-3.5 text-slate-500" /> Technician: {req.assignedToStaffName || 'Unassigned'}
                </span>
                <span>•</span>
                <span>Created: {new Date(req.createdAt).toLocaleDateString()}</span>
              </div>
            </div>

            <div className="shrink-0 flex items-center gap-2">
              {req.status === 'REQUESTED' && (
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => handleUpdateStatus(req.id, 'IN_PROGRESS')}
                >
                  Start Work
                </Button>
              )}
              {req.status === 'IN_PROGRESS' && (
                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => handleUpdateStatus(req.id, 'VERIFIED')}
                >
                  Mark Verified
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* New Work Order Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Dispatch Maintenance Work Order"
        subtitle="Issue repair order to campus facilities engineering team"
        maxWidth="md"
      >
        <form onSubmit={handleCreateRequest} className="space-y-4">
          <Input
            label="Location / Venue / Room"
            required
            value={locationName}
            onChange={(e) => setLocationName(e.target.value)}
            placeholder="e.g. Turing Hall, Room 302"
          />

          <Select
            label="Priority / Hazard Level"
            value={priority}
            onChange={(e) => setPriority(e.target.value as PriorityLevel)}
            options={[
              { value: 'LOW', label: 'Low (Scheduled routine)' },
              { value: 'MEDIUM', label: 'Medium (Standard 24h)' },
              { value: 'HIGH', label: 'High (Immediate operational impact)' },
              { value: 'CRITICAL', label: 'Critical (Safety / Electrical hazard)' },
            ]}
          />

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 font-mono">
              Problem Description & Symptoms
            </label>
            <textarea
              required
              rows={4}
              value={issueDescription}
              onChange={(e) => setIssueDescription(e.target.value)}
              placeholder="Describe malfunction, leaking pipes, HVAC temperature deviations, or fixture breaks..."
              className="w-full bg-[#090E17] border border-slate-800 rounded-lg p-3 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-cyan-500 font-sans"
            />
          </div>

          <div className="pt-4 border-t border-slate-800 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isSubmitting}>
              Dispatch Order
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
