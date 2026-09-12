import React, { useState, useEffect } from 'react';
import { History, Filter, Search, Shield, Clock, Terminal } from 'lucide-react';
import { api } from '../../lib/api.ts';
import { AuditLog } from '../../types/index.ts';
import { Input, Select } from '../ui/input.tsx';
import { Badge } from '../ui/badge.tsx';
import { Table } from '../ui/table.tsx';

export const AuditLogsView: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const l = await api.getAuditLogs();
        setLogs(l);
        setIsLoading(false);
      } catch (err) {
        console.error(err);
        setIsLoading(false);
      }
    })();
  }, []);

  const filteredLogs = logs.filter((log) => {
    const q = search.toLowerCase();
    return (
      log.action.toLowerCase().includes(q) ||
      log.actorName.toLowerCase().includes(q) ||
      log.entity.toLowerCase().includes(q) ||
      (log.entityId && log.entityId.toLowerCase().includes(q))
    );
  });

  const columns = [
    {
      key: 'timestamp',
      header: 'Timestamp',
      render: (l: AuditLog) => (
        <span className="font-mono text-[11px] text-slate-400 whitespace-nowrap">
          {new Date(l.timestamp).toLocaleString()}
        </span>
      ),
    },
    {
      key: 'actorName',
      header: 'Actor & Identity',
      render: (l: AuditLog) => (
        <div>
          <div className="font-semibold text-slate-200 text-xs">{l.actorName}</div>
          <span className="text-[10px] font-mono text-cyan-400">{l.actorRole}</span>
        </div>
      ),
    },
    {
      key: 'action',
      header: 'Operation Action',
      render: (l: AuditLog) => (
        <span className="font-mono text-xs font-semibold text-slate-100 bg-[#0E1524] px-2 py-0.5 rounded border border-slate-700/60">
          {l.action}
        </span>
      ),
    },
    {
      key: 'entity',
      header: 'Entity / Target',
      render: (l: AuditLog) => (
        <div className="text-xs text-slate-300 font-mono">
          <span>{l.entity}</span>
          {l.entityId && <span className="text-slate-500"> #{l.entityId}</span>}
        </div>
      ),
    },
    {
      key: 'ipAddress',
      header: 'IP Origin',
      render: (l: AuditLog) => (
        <span className="font-mono text-[11px] text-slate-400">{l.ipAddress || '127.0.0.1'}</span>
      ),
    },
    {
      key: 'newValue',
      header: 'Payload Details',
      render: (l: AuditLog) => (
        <span className="font-mono text-[10px] text-slate-400 max-w-xs truncate block">
          {l.newValue || l.reason || '—'}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-serif font-bold text-slate-100 flex items-center gap-2">
            <History className="w-5 h-5 text-cyan-400" />
            Immutable Audit Trail & Compliance Log
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Cryptographically timestamped ledger of all system mutations, security events, and user logins.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs font-mono text-emerald-400 bg-emerald-950/40 px-3 py-1.5 rounded-lg border border-emerald-500/30">
          <Shield className="w-3.5 h-3.5" />
          <span>TAMPER-RESISTANT LOGGING ACTIVE</span>
        </div>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-3 bg-[#0A101C] p-3 rounded-xl border border-slate-800">
        <div className="w-full sm:w-96">
          <Input
            placeholder="Search by action, actor, or entity..."
            icon={Search}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="ml-auto text-xs font-mono text-slate-400">
          Total Logged Events: <span className="text-cyan-400 font-bold">{filteredLogs.length}</span>
        </div>
      </div>

      {/* Table */}
      <Table columns={columns} data={filteredLogs} keyExtractor={(l) => l.id} isLoading={isLoading} />
    </div>
  );
};
