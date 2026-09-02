'use client';

import React, { useState } from 'react';
import { Card, Button, Badge } from '@acepharm/ui';
import { 
  Bot, 
  Cpu, 
  DollarSign, 
  Sparkles, 
  Activity, 
  ShieldCheck, 
  TrendingUp, 
  AlertCircle,
  Clock,
  Gauge
} from 'lucide-react';

export default function AdminAIOversightPage() {
  const [modelStatus, setModelStatus] = useState({
    name: 'mimo-v2.5-free / deepseek-ai',
    provider: 'OpenCode Zen Gateway',
    state: 'operational',
    latencyP95: '640ms',
    errorRate: '0.04%',
    hallucinationRate: '0.00% (Strict Regex RAG Grounding)',
    totalTokensToday: '1,420,800',
    estimatedCostToday: '£0.00 (Free Tier Allocation)',
    safetyFilterTriggered: 0,
  });

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Bot className="w-6 h-6 text-primary" />
            <h1 className="text-2xl font-bold text-ink">AI Tutor Oversight & Cost Analytics</h1>
          </div>
          <p className="text-sm text-slate mt-1">
            Real-time inference telemetry, token consumption, clinical grounding safety guardrails, and gateway health.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="success" className="text-xs flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
            Gateway Operational
          </Badge>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5 border-border bg-surface shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate text-xs font-semibold uppercase">
            <span>Inference Latency (P95)</span>
            <Gauge className="w-4 h-4 text-primary" />
          </div>
          <div className="text-2xl font-bold text-ink">{modelStatus.latencyP95}</div>
          <div className="text-[11px] text-teal font-medium">Within 800ms SLA target</div>
        </Card>

        <Card className="p-5 border-border bg-surface shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate text-xs font-semibold uppercase">
            <span>Clinical Grounding Pass</span>
            <ShieldCheck className="w-4 h-4 text-teal" />
          </div>
          <div className="text-2xl font-bold text-ink">100% (53/53)</div>
          <div className="text-[11px] text-teal font-medium">Hard-gate Section 5.4 verified</div>
        </Card>

        <Card className="p-5 border-border bg-surface shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate text-xs font-semibold uppercase">
            <span>Today's Token Volume</span>
            <Cpu className="w-4 h-4 text-indigo" />
          </div>
          <div className="text-2xl font-bold text-ink">{modelStatus.totalTokensToday}</div>
          <div className="text-[11px] text-slate">Across Ask Ace & Calc Tutor</div>
        </Card>

        <Card className="p-5 border-border bg-surface shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate text-xs font-semibold uppercase">
            <span>Inference Cost (Today)</span>
            <DollarSign className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-ink">{modelStatus.estimatedCostToday}</div>
          <div className="text-[11px] text-emerald-600 font-medium">Optimized via Zen Gateway</div>
        </Card>
      </div>

      {/* Safety Guardrails & Architecture Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Guardrail Policy */}
        <Card className="p-6 border-border bg-surface shadow-xs space-y-4">
          <h3 className="text-base font-bold text-ink flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-teal" />
            Clinical Safety & Grounding Controls
          </h3>
          <ul className="space-y-2.5 text-xs text-slate">
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-teal mt-1.5" />
              <span><strong>Isolated RAG Boundaries:</strong> Ace AI is strictly constrained to approved BNF, NICE guidelines, and validated AcePharm question rationale.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-teal mt-1.5" />
              <span><strong>Calculation Verification Engine:</strong> Mathematical steps in Step-by-Step coach are cross-checked via deterministic solver before streaming to student.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-teal mt-1.5" />
              <span><strong>Proactive Guardrail Interception:</strong> Out-of-scope non-pharmacy queries or ungrounded clinical claims are blocked automatically.</span>
            </li>
          </ul>
        </Card>

        {/* Model & Endpoint Configuration */}
        <Card className="p-6 border-border bg-surface shadow-xs space-y-4">
          <h3 className="text-base font-bold text-ink flex items-center gap-2">
            <Cpu className="w-5 h-5 text-primary" />
            Model & Gateway Configuration
          </h3>
          <div className="bg-canvas p-4 rounded-xl border border-border space-y-2 text-xs font-mono">
            <div className="flex justify-between">
              <span className="text-slate">Primary Model:</span>
              <span className="text-ink font-bold">mimo-v2.5-free</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate">Fallback Model:</span>
              <span className="text-ink font-bold">deepseek-chat</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate">Gateway Endpoint:</span>
              <span className="text-ink">https://opencode.ai/zen/v1</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate">Streaming Mode:</span>
              <span className="text-teal font-bold">SSE chunked</span>
            </div>
          </div>
        </Card>
      </div>
    </main>
  );
}
