'use client';

import React, { useState } from 'react';
import { Card, Button, Badge } from '@acepharm/ui';
import { 
  Flag, 
  AlertTriangle, 
  CheckCircle2, 
  ExternalLink, 
  MessageSquare, 
  ShieldAlert, 
  Clock, 
  RotateCcw,
  Check,
  X
} from 'lucide-react';

interface ReportedItem {
  id: string;
  questionId: string;
  questionTitle: string;
  category: string;
  reportedBy: string;
  reporterRole: string;
  reason: 'clinical_accuracy' | 'outdated_guideline' | 'ambiguous_leadin' | 'typo_formatting';
  details: string;
  timestamp: string;
  status: 'pending' | 'in_review' | 'resolved' | 'dismissed';
  priority: 'high' | 'medium' | 'low';
}

const INITIAL_REPORTS: ReportedItem[] = [
  {
    id: 'rep_01',
    questionId: 'ACP-CV-0012',
    questionTitle: 'Ramipril dosing titration and renal monitoring intervals in stage 3 CKD',
    category: 'Cardiovascular',
    reportedBy: 'Aisha Patel (KCL MPharm Year 4)',
    reporterRole: 'Student',
    reason: 'outdated_guideline',
    details: 'NICE updated chronic kidney disease monitoring guidelines (NG203) regarding potassium threshold actions. Check option C explanation.',
    timestamp: '2 hours ago',
    status: 'pending',
    priority: 'high',
  },
  {
    id: 'rep_02',
    questionId: 'ACP-CALC-0084',
    questionTitle: 'Gentamicin once-daily dosing calculation in severe sepsis (Hartford Nomogram)',
    category: 'Calculations',
    reportedBy: 'Liam O’Connor (Bath University)',
    reporterRole: 'Student',
    reason: 'ambiguous_leadin',
    details: 'The prompt specifies ideal body weight in text, but the lab table includes actual weight which might confuse students on IBW adjustments.',
    timestamp: '5 hours ago',
    status: 'in_review',
    priority: 'medium',
  },
  {
    id: 'rep_03',
    questionId: 'ACP-ONC-0005',
    questionTitle: 'Methotrexate weekly oral dosing vs folic acid rescue timing',
    category: 'Oncology & Immunosuppression',
    reportedBy: 'Dr. Marcus Vance (MPharm, PhD)',
    reporterRole: 'Clinical Reviewer',
    reason: 'clinical_accuracy',
    details: 'Clarified that folic acid should be taken on a different day of the week to methotrexate to prevent inadvertent daily folic acid confusion.',
    timestamp: '1 day ago',
    status: 'resolved',
    priority: 'high',
  },
];

export default function AdminReportedContentPage() {
  const [reports, setReports] = useState<ReportedItem[]>(INITIAL_REPORTS);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedReport, setSelectedReport] = useState<ReportedItem | null>(null);

  const filteredReports = reports.filter((r) => 
    statusFilter === 'all' ? true : r.status === statusFilter
  );

  const handleUpdateStatus = (id: string, newStatus: ReportedItem['status']) => {
    setReports((prev) => prev.map((r) => r.id === id ? { ...r, status: newStatus } : r));
    if (selectedReport?.id === id) {
      setSelectedReport((prev) => prev ? { ...prev, status: newStatus } : null);
    }
  };

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Flag className="w-6 h-6 text-danger" />
            <h1 className="text-2xl font-bold text-ink">Reported Content Queue</h1>
          </div>
          <p className="text-sm text-slate mt-1">
            Review community flags, clinical discrepancy reports, and suggested BNF/NICE guideline updates.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">
            Pending Review: {reports.filter(r => r.status === 'pending').length}
          </Badge>
          <Badge variant="success" className="text-xs">
            Resolved: {reports.filter(r => r.status === 'resolved').length}
          </Badge>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-border pb-2">
        {(['all', 'pending', 'in_review', 'resolved', 'dismissed'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setStatusFilter(tab)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-colors ${
              statusFilter === tab
                ? 'bg-primary text-white'
                : 'text-slate hover:text-ink hover:bg-canvas'
            }`}
          >
            {tab.replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* Report Cards Grid */}
      <div className="grid grid-cols-1 gap-4">
        {filteredReports.map((report) => (
          <Card key={report.id} className="p-5 border-border bg-surface shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Badge variant={report.priority === 'high' ? 'danger' : 'outline'} className="text-[11px] uppercase">
                    {report.priority} Priority
                  </Badge>
                  <span className="text-xs font-mono text-slate">{report.questionId}</span>
                  <span className="text-xs text-slate">&bull; {report.category}</span>
                </div>
                <h3 className="text-base font-bold text-ink hover:text-primary transition-colors">
                  {report.questionTitle}
                </h3>
              </div>

              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
                report.status === 'pending' ? 'bg-amber-100 text-amber-800' :
                report.status === 'in_review' ? 'bg-blue-100 text-blue-800' :
                report.status === 'resolved' ? 'bg-teal-100 text-teal-800' :
                'bg-gray-100 text-gray-700'
              }`}>
                {report.status.replace('_', ' ')}
              </span>
            </div>

            {/* Report Content Body */}
            <div className="bg-canvas p-3 rounded-lg border border-border text-xs space-y-1.5">
              <div className="flex items-center justify-between text-slate font-medium">
                <span>Reason: <strong className="text-ink uppercase">{report.reason.replace('_', ' ')}</strong></span>
                <span>Reported by: <strong>{report.reportedBy}</strong> ({report.timestamp})</span>
              </div>
              <p className="text-slate leading-relaxed pt-1">
                &ldquo;{report.details}&rdquo;
              </p>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
              <a
                href={`/admin/review?questionId=${report.questionId}`}
                className="inline-flex items-center gap-1.5 text-xs text-primary font-bold hover:underline"
              >
                Open Question in Clinical Review Machine
                <ExternalLink className="w-3.5 h-3.5" />
              </a>

              <div className="flex items-center gap-2">
                {report.status !== 'resolved' && (
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={() => handleUpdateStatus(report.id, 'resolved')}
                    className="text-xs flex items-center gap-1"
                  >
                    <Check className="w-3.5 h-3.5" />
                    Mark Resolved
                  </Button>
                )}
                {report.status === 'pending' && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleUpdateStatus(report.id, 'in_review')}
                    className="text-xs"
                  >
                    Set In Review
                  </Button>
                )}
                {report.status !== 'dismissed' && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleUpdateStatus(report.id, 'dismissed')}
                    className="text-xs text-slate hover:text-danger"
                  >
                    Dismiss Flag
                  </Button>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </main>
  );
}
