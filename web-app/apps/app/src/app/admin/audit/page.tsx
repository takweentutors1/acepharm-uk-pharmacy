'use client';

import React, { useState } from 'react';
import { Card, Button, Badge } from '@acepharm/ui';
import { 
  FileText, 
  ShieldCheck, 
  Search, 
  Filter, 
  User, 
  Tag, 
  Lock, 
  Activity, 
  Database,
  Calendar
} from 'lucide-react';

interface AuditLogEntry {
  id: string;
  actor: string;
  actorRole: string;
  action: string;
  targetType: 'question' | 'user' | 'subscription' | 'curriculum' | 'system_config';
  targetId: string;
  details: string;
  ipAddress: string;
  timestamp: string;
  severity: 'info' | 'warning' | 'critical';
}

const INITIAL_LOGS: AuditLogEntry[] = [
  {
    id: 'log_9001',
    actor: 'Dr. Marcus Vance',
    actorRole: 'Clinical Reviewer',
    action: 'APPROVED_CLINICAL_REVIEW',
    targetType: 'question',
    targetId: 'ACP-CV-0012',
    details: 'Completed Section 7.4 6-point clinical checklist with 0 patient safety risks.',
    ipAddress: '194.80.232.14 (London, UK)',
    timestamp: '2026-08-29 16:14:02',
    severity: 'info',
  },
  {
    id: 'log_9002',
    actor: 'Stripe Webhook Worker',
    actorRole: 'System Automation',
    action: 'SUBSCRIPTION_PROMOTED',
    targetType: 'subscription',
    targetId: 'sub_1Qe889...',
    details: 'Upgraded user usr_01 (aisha.patel@kcl.ac.uk) to yearly plan £49.99/yr.',
    ipAddress: '54.187.174.169 (Stripe US)',
    timestamp: '2026-08-29 15:42:19',
    severity: 'info',
  },
  {
    id: 'log_9003',
    actor: 'Sarah Jenkins',
    actorRole: 'Administrator',
    action: 'USER_ACCOUNT_SUSPENDED',
    targetType: 'user',
    targetId: 'usr_05',
    details: 'Suspended account due to automated rate-limit abuse on calculation solver endpoint.',
    ipAddress: '82.165.197.1 (Manchester, UK)',
    timestamp: '2026-08-29 14:05:44',
    severity: 'warning',
  },
  {
    id: 'log_9004',
    actor: 'Content Import Bot',
    actorRole: 'System',
    action: 'BULK_IMPORT_COMPLETED',
    targetType: 'curriculum',
    targetId: 'BATCH_2026_Q3',
    details: 'Imported 120 new BNF Chapter 2 high-yield cardiovascular items.',
    ipAddress: '127.0.0.1 (Worker internal)',
    timestamp: '2026-08-29 09:12:00',
    severity: 'info',
  },
];

export default function AdminAuditLogPage() {
  const [logs, setLogs] = useState<AuditLogEntry[]>(INITIAL_LOGS);
  const [search, setSearch] = useState('');
  const [severityFilter, setSeverityFilter] = useState<string>('all');

  const filteredLogs = logs.filter((log) => {
    const matchesSearch = log.actor.toLowerCase().includes(search.toLowerCase()) ||
                          log.action.toLowerCase().includes(search.toLowerCase()) ||
                          log.targetId.toLowerCase().includes(search.toLowerCase()) ||
                          log.details.toLowerCase().includes(search.toLowerCase());
    const matchesSeverity = severityFilter === 'all' || log.severity === severityFilter;
    return matchesSearch && matchesSeverity;
  });

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-primary" />
            <h1 className="text-2xl font-bold text-ink">System Audit Trail & Compliance Log</h1>
          </div>
          <p className="text-sm text-slate mt-1">
            Immutable log of clinical sign-offs, user role modifications, and automated security actions.
          </p>
        </div>
        <Badge variant="outline" className="text-xs font-mono">
          Retention: 365 Days &bull; Encrypted
        </Badge>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row items-center gap-3 bg-surface p-3 rounded-xl border border-border">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate" />
          <input
            type="text"
            placeholder="Search audit trail by actor, action type, or target ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-canvas border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <select
          value={severityFilter}
          onChange={(e) => setSeverityFilter(e.target.value)}
          className="text-sm bg-canvas border border-border rounded-lg px-3 py-2 text-ink focus:outline-none w-full sm:w-auto"
        >
          <option value="all">All Severities</option>
          <option value="info">Informational</option>
          <option value="warning">Warnings</option>
          <option value="critical">Critical / Security</option>
        </select>
      </div>

      {/* Audit Log Table */}
      <Card className="overflow-hidden border-border bg-surface shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-canvas border-b border-border text-xs uppercase text-slate font-bold tracking-wider">
              <tr>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Actor</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Target</th>
                <th className="py-3 px-4">Details</th>
                <th className="py-3 px-4">Origin IP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-xs">
              {filteredLogs.map((entry) => (
                <tr key={entry.id} className="hover:bg-canvas/50 transition-colors">
                  <td className="py-3 px-4 font-mono text-slate whitespace-nowrap">
                    {entry.timestamp}
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-bold text-ink">{entry.actor}</div>
                    <div className="text-[11px] text-slate">{entry.actorRole}</div>
                  </td>
                  <td className="py-3 px-4">
                    <span className="font-mono font-bold text-primary px-2 py-0.5 bg-primary/10 rounded">
                      {entry.action}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-mono text-ink">{entry.targetId}</div>
                    <div className="text-[11px] text-slate capitalize">{entry.targetType}</div>
                  </td>
                  <td className="py-3 px-4 text-slate max-w-xs sm:max-w-sm">
                    {entry.details}
                  </td>
                  <td className="py-3 px-4 font-mono text-slate whitespace-nowrap">
                    {entry.ipAddress}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </main>
  );
}
