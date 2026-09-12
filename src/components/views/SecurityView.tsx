import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  Plus,
  AlertTriangle,
  Radio,
  Lock,
  Unlock,
  MapPin,
  Clock,
  Camera,
  UserCheck,
} from 'lucide-react';
import { api } from '../../lib/api.ts';
import { SecurityZone, SecurityIncident, PriorityLevel } from '../../types/index.ts';
import { Button } from '../ui/button.tsx';
import { Input, Select } from '../ui/input.tsx';
import { Badge } from '../ui/badge.tsx';
import { Modal } from '../ui/modal.tsx';

export const SecurityView: React.FC = () => {
  const [zones, setZones] = useState<SecurityZone[]>([]);
  const [incidents, setIncidents] = useState<SecurityIncident[]>([]);
  const [isLockdownActive, setIsLockdownActive] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Incident Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [type, setType] = useState('UNAUTHORIZED_ACCESS');
  const [severity, setSeverity] = useState<PriorityLevel>('MEDIUM');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadSecurityData = async () => {
    try {
      const [z, inc] = await Promise.all([api.getSecurityZones(), api.getSecurityIncidents()]);
      setZones(z);
      setIncidents(inc);
      if (z.length > 0 && !location) setLocation(z[0].name);
      setIsLoading(false);
    } catch (err) {
      console.error(err);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSecurityData();
  }, []);

  const handleLogIncident = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await api.logSecurityIncident({
        type: type as any,
        severity,
        location,
        description,
        status: 'ACTIVE',
      });
      setIsModalOpen(false);
      setDescription('');
      await loadSecurityData();
    } catch (err: any) {
      alert(err.message || 'Failed to log incident');
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleLockdown = () => {
    const nextState = !isLockdownActive;
    setIsLockdownActive(nextState);
    if (nextState) {
      alert('CAMPUS PERIMETER LOCKDOWN INITIATED: Automated boom barriers and turnstiles sealed.');
    } else {
      alert('CAMPUS PERIMETER LOCKDOWN LIFTED: Standard gate clearance restored.');
    }
  };

  const severityVariant = (s: PriorityLevel) => {
    switch (s) {
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

  return (
    <div className="space-y-6">
      {/* Header & Emergency Lockdown Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono font-semibold uppercase tracking-wider text-rose-400">
              CAMPUS SECURITY OPERATIONS CENTER (SOC)
            </span>
            <Badge variant={isLockdownActive ? 'danger' : 'success'} size="sm" dot>
              {isLockdownActive ? 'ACTIVE LOCKDOWN' : 'ALL PERIMETERS SECURE'}
            </Badge>
          </div>
          <h1 className="text-xl font-serif font-bold text-slate-100 flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-rose-400" />
            Security & Gate Perimeter Control
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Surveillance zone telemetry, guard station rosters, and live incident response logs.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant={isLockdownActive ? 'danger' : 'outline'}
            size="sm"
            icon={isLockdownActive ? Unlock : Lock}
            onClick={toggleLockdown}
          >
            {isLockdownActive ? 'Lift Campus Lockdown' : 'Trigger Emergency Lockdown'}
          </Button>
          <Button variant="primary" size="sm" icon={Plus} onClick={() => setIsModalOpen(true)}>
            Log Incident
          </Button>
        </div>
      </div>

      {/* Perimeter Zones Grid */}
      <div>
        <div className="text-xs font-mono font-semibold uppercase tracking-wider text-slate-400 mb-3 flex items-center justify-between">
          <span>MONITORED CAMPUS ZONES ({zones.length})</span>
          <span className="text-cyan-400">58 SURVEILLANCE STREAMS ACTIVE</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {zones.map((zone) => (
            <div
              key={zone.id}
              className="p-4 rounded-xl bg-[#0A101C] border border-slate-800 hover:border-slate-700 transition-all space-y-3"
            >
              <div className="flex items-start justify-between gap-2">
                <span className="text-xs font-semibold text-slate-200">{zone.name}</span>
                <Badge
                  variant={zone.status === 'NORMAL' ? 'success' : zone.status === 'LOCKDOWN' ? 'danger' : 'warning'}
                  size="sm"
                  dot
                >
                  {zone.status}
                </Badge>
              </div>

              <div className="space-y-1 text-[11px] font-mono text-slate-400">
                <div className="flex items-center gap-1.5">
                  <UserCheck className="w-3.5 h-3.5 text-slate-500" />
                  <span>Station Guards: {zone.activeGuardsCount}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Camera className="w-3.5 h-3.5 text-slate-500" />
                  <span>Cameras Online: {zone.cameraStreamsCount} Streams</span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800 text-[10px] font-mono text-slate-500 flex items-center justify-between">
                <span>Access: {zone.clearanceLevel}</span>
                <Radio className="w-3 h-3 text-emerald-400 animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Live Security Incidents Log */}
      <div className="p-5 rounded-xl bg-[#0A101C] border border-slate-800 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <h2 className="text-xs font-mono font-semibold uppercase tracking-wider text-slate-200">
              Security Incident Register ({incidents.length})
            </h2>
          </div>
        </div>

        <div className="divide-y divide-slate-800/60">
          {incidents.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-500 font-mono">
              Zero security incidents recorded in this reporting period.
            </div>
          ) : (
            incidents.map((inc) => (
              <div key={inc.id} className="py-3.5 flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-cyan-400 font-bold">{inc.incidentCode}</span>
                    <Badge variant={severityVariant(inc.severity)} size="sm">
                      {inc.severity}
                    </Badge>
                    <span className="text-xs font-semibold text-slate-200">{inc.type.replace('_', ' ')}</span>
                  </div>
                  <p className="text-xs text-slate-400 max-w-2xl">{inc.description}</p>
                  <div className="flex items-center gap-3 text-[11px] font-mono text-slate-500 pt-1">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-slate-500" /> {inc.location}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-500" /> {new Date(inc.reportedAt).toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="shrink-0">
                  <Badge variant={inc.status === 'RESOLVED' ? 'success' : 'warning'} size="sm">
                    {inc.status}
                  </Badge>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Log Incident Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Log Security Incident"
        subtitle="Formal entry into campus security & police liaison log"
        maxWidth="md"
      >
        <form onSubmit={handleLogIncident} className="space-y-4">
          <Select
            label="Incident Classification"
            value={type}
            onChange={(e) => setType(e.target.value)}
            options={[
              { value: 'UNAUTHORIZED_ACCESS', label: 'Unauthorized Access / Trespass' },
              { value: 'FIRE_ALARM', label: 'Fire / Smoke Sensor Alarm' },
              { value: 'NOISE_COMPLAINT', label: 'Disorder / Noise Disturbance' },
              { value: 'THEFT_PROPERTY', label: 'Theft / Property Damage' },
              { value: 'MEDICAL_EMERGENCY', label: 'Medical Emergency' },
              { value: 'VEHICLE_COLLISION', label: 'Vehicle Incident on Campus' },
            ]}
          />

          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Severity Level"
              value={severity}
              onChange={(e) => setSeverity(e.target.value as PriorityLevel)}
              options={[
                { value: 'LOW', label: 'Low' },
                { value: 'MEDIUM', label: 'Medium' },
                { value: 'HIGH', label: 'High' },
                { value: 'CRITICAL', label: 'Critical / Breach' },
              ]}
            />
            <Input
              label="Location / Landmark"
              required
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. Main Gate 1"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 font-mono">
              Incident Details & Officer Actions
            </label>
            <textarea
              required
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide sequence of events, personnel involved, and containment steps..."
              className="w-full bg-[#090E17] border border-slate-800 rounded-lg p-3 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-cyan-500 font-sans"
            />
          </div>

          <div className="pt-4 border-t border-slate-800 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isSubmitting}>
              Record Incident
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
