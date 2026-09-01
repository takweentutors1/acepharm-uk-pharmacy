'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Card } from '@acepharm/ui';
import { 
  User, 
  Bot, 
  Send, 
  Sparkles, 
  CheckCircle, 
  Award, 
  RotateCw, 
  MessageSquare, 
  AlertCircle,
  HelpCircle,
  Stethoscope
} from 'lucide-react';

export interface RubricCriterion {
  id: string;
  criterion: string;
  maxPoints: number;
  description: string;
}

export interface ScenarioData {
  id: string;
  title: string;
  description: string;
  personaName: string;
  personaRole: string;
  scenarioContext: string;
  rubric: RubricCriterion[];
}

export interface SimulationExchange {
  speaker: 'pharmacist' | 'patient';
  text: string;
}

export interface EvaluationResult {
  score: number;
  maxScore: number;
  passed: boolean;
  criteriaResults: {
    criterionId: string;
    awarded: number;
    feedback: string;
  }[];
  overallFeedback: string;
}

export function ConsultationScenarioPlayer() {
  const [scenario, setScenario] = useState<ScenarioData | null>(null);
  const [transcript, setTranscript] = useState<SimulationExchange[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [evaluating, setEvaluating] = useState(false);
  const [evaluation, setEvaluation] = useState<EvaluationResult | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://api.acepharmexams.co.uk';

  useEffect(() => {
    fetchScenario();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcript, sending]);

  async function fetchScenario() {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/v1/ace/simulator/scenarios`);
      if (res.ok) {
        const data = await res.json() as { scenarios: ScenarioData[] };
        if (data.scenarios && data.scenarios.length > 0) {
          const sc = data.scenarios[0];
          setScenario(sc);
          // Initial greeting from patient
          setTranscript([
            {
              speaker: 'patient',
              text: `Hello pharmacist. The doctor diagnosed me with asthma today and gave me these two inhalers (one brown and one blue). I've never used them before. Can you explain what they are and how I should take them?`,
            },
          ]);
        }
      }
    } catch (err) {
      console.warn('Scenario fetch error:', err);
    } finally {
      setLoading(false);
    }
  }

  const pharmacistExchangeCount = transcript.filter((t) => t.speaker === 'pharmacist').length;
  const isSimulationFinished = pharmacistExchangeCount >= 4;

  async function handleSendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!inputText.trim() || sending || !scenario || isSimulationFinished) return;

    const userMessage = inputText.trim();
    setInputText('');
    setSending(true);

    const updatedTranscript: SimulationExchange[] = [
      ...transcript,
      { speaker: 'pharmacist', text: userMessage },
    ];
    setTranscript(updatedTranscript);

    const newPharmacistCount = updatedTranscript.filter((t) => t.speaker === 'pharmacist').length;

    try {
      if (newPharmacistCount < 4) {
        const res = await fetch(`${API_BASE}/api/v1/ace/simulator/exchange`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            scenarioId: scenario.id,
            transcript: updatedTranscript,
          }),
        });

        if (res.ok) {
          const data = await res.json() as { reply: string };
          setTranscript((prev) => [...prev, { speaker: 'patient', text: data.reply }]);
        }
      } else {
        // Exchange 4 complete -> evaluate transcript
        await handleEvaluateSimulation(updatedTranscript);
      }
    } catch (err) {
      console.warn('Simulator exchange error:', err);
    } finally {
      setSending(false);
    }
  }

  async function handleEvaluateSimulation(finalTranscript: SimulationExchange[]) {
    if (!scenario) return;
    setEvaluating(true);

    try {
      const res = await fetch(`${API_BASE}/api/v1/ace/simulator/evaluate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scenarioId: scenario.id,
          transcript: finalTranscript,
        }),
      });

      if (res.ok) {
        const data = await res.json() as { evaluation: EvaluationResult };
        setEvaluation(data.evaluation);
      }
    } catch (err) {
      console.warn('Evaluation error:', err);
    } finally {
      setEvaluating(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12 bg-surface-raised rounded-2xl border border-border-subtle animate-pulse">
        <div className="text-center">
          <RotateCw className="w-8 h-8 text-primary animate-spin mx-auto mb-3" />
          <p className="text-sm font-medium text-ink-muted">Loading clinical OSCE simulation...</p>
        </div>
      </div>
    );
  }

  if (!scenario) {
    return (
      <Card className="p-8 text-center bg-surface-raised border border-border-subtle rounded-2xl">
        <p className="text-sm text-ink-muted">No active OSCE simulation scenario found.</p>
      </Card>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Header & Scenario Briefing */}
      <Card className="p-6 bg-gradient-to-r from-primary-50/50 to-white border border-primary/20 rounded-2xl shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider flex items-center gap-1">
                <Stethoscope className="w-3.5 h-3.5" /> GPhC OSCE Consultation Simulator
              </span>
              <span className="text-xs font-semibold text-ink-muted">
                Exchange {Math.min(pharmacistExchangeCount + 1, 4)} of 4
              </span>
            </div>
            <h2 className="text-xl font-bold text-ink">{scenario.title}</h2>
            <p className="text-sm text-ink-muted mt-1 leading-relaxed">{scenario.description}</p>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Dialogue Stream */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="p-4 sm:p-6 bg-white border border-border-subtle rounded-2xl shadow-sm min-h-[420px] max-h-[520px] flex flex-col justify-between overflow-hidden">
            {/* Scrollable Dialogue Area */}
            <div className="overflow-y-auto space-y-4 pr-1 pb-4">
              {transcript.map((msg, index) => (
                <div
                  key={index}
                  className={`flex items-start gap-3 ${
                    msg.speaker === 'pharmacist' ? 'flex-row-reverse' : 'flex-row'
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                      msg.speaker === 'pharmacist'
                        ? 'bg-primary text-white'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {msg.speaker === 'pharmacist' ? <Stethoscope className="w-4 h-4" /> : <User className="w-4 h-4" />}
                  </div>
                  <div
                    className={`max-w-[80%] rounded-2xl p-3.5 text-sm leading-relaxed ${
                      msg.speaker === 'pharmacist'
                        ? 'bg-primary text-white rounded-tr-none'
                        : 'bg-slate-100 text-ink rounded-tl-none border border-slate-200/60'
                    }`}
                  >
                    <div className="text-[10px] font-bold uppercase tracking-wider mb-1 opacity-75">
                      {msg.speaker === 'pharmacist' ? 'You (Pharmacist)' : scenario.personaName}
                    </div>
                    {msg.text}
                  </div>
                </div>
              ))}

              {sending && (
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
                    <User className="w-4 h-4" />
                  </div>
                  <div className="bg-slate-100 rounded-2xl rounded-tl-none p-3.5 text-xs text-ink-muted flex items-center gap-2 border border-slate-200">
                    <RotateCw className="w-3.5 h-3.5 animate-spin" /> {scenario.personaName} is responding...
                  </div>
                </div>
              )}

              {evaluating && (
                <div className="p-4 bg-primary-50 text-primary border border-primary/20 rounded-xl text-center text-sm font-semibold flex items-center justify-center gap-2">
                  <RotateCw className="w-4 h-4 animate-spin" /> Senior GPhC Clinical Examiner is grading your consultation...
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input Form */}
            {!evaluation ? (
              <form onSubmit={handleSendMessage} className="pt-3 border-t border-border-subtle">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder={
                      isSimulationFinished
                        ? 'Consultation finished — viewing evaluation...'
                        : 'Type your clinical advice to the patient...'
                    }
                    disabled={sending || evaluating || isSimulationFinished}
                    className="flex-1 px-4 py-2.5 bg-surface-raised border border-border-subtle rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                  <button
                    type="submit"
                    disabled={!inputText.trim() || sending || evaluating || isSimulationFinished}
                    className="px-4 py-2.5 bg-primary hover:bg-primary-hover disabled:opacity-40 text-white rounded-xl text-sm font-semibold transition-colors flex items-center gap-1.5"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </form>
            ) : (
              <div className="pt-3 border-t border-border-subtle text-center">
                <button
                  onClick={() => {
                    setEvaluation(null);
                    fetchScenario();
                  }}
                  className="px-4 py-2 bg-primary text-white text-xs font-semibold rounded-xl hover:bg-primary-hover transition-colors"
                >
                  Restart Consultation Simulation
                </button>
              </div>
            )}
          </Card>
        </div>

        {/* Live 6-Point OSCE Rubric / Examiner Feedback */}
        <div className="space-y-4">
          <Card className="p-5 bg-white border border-border-subtle rounded-2xl shadow-sm">
            <h3 className="text-sm font-bold uppercase tracking-wider text-ink mb-3 flex items-center gap-1.5">
              <Award className="w-4 h-4 text-primary" /> 6-Point Clinical Rubric
            </h3>

            {evaluation ? (
              <div className="space-y-4">
                <div className={`p-4 rounded-xl text-center border ${
                  evaluation.passed ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-amber-50 border-amber-200 text-amber-800'
                }`}>
                  <div className="text-2xl font-extrabold">{evaluation.score} / {evaluation.maxScore}</div>
                  <div className="text-xs font-bold uppercase tracking-wider mt-1">
                    {evaluation.passed ? 'Pass (GPhC OSCE Standard)' : 'Unsatisfactory — Action Required'}
                  </div>
                </div>

                <div className="space-y-2">
                  {evaluation.criteriaResults.map((cr, i) => (
                    <div key={cr.criterionId} className="p-2.5 bg-surface-raised rounded-xl text-xs border border-border-subtle/80">
                      <div className="flex items-center justify-between font-bold text-ink">
                        <span>{scenario.rubric[i]?.criterion || `Criterion ${i + 1}`}</span>
                        <span className={cr.awarded > 0 ? 'text-emerald-600' : 'text-red-500'}>
                          {cr.awarded} / 1 pt
                        </span>
                      </div>
                      <p className="text-ink-muted text-[11px] mt-1 leading-snug">{cr.feedback}</p>
                    </div>
                  ))}
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <div className="text-[11px] font-bold text-ink uppercase tracking-wide mb-1">Examiner Feedback</div>
                  <p className="text-xs text-ink-muted leading-relaxed">{evaluation.overallFeedback}</p>
                </div>
              </div>
            ) : (
              <div className="space-y-2.5 text-xs">
                {scenario.rubric.map((r, i) => (
                  <div key={r.id} className="p-2.5 bg-surface-raised rounded-xl border border-border-subtle">
                    <div className="font-semibold text-ink flex items-center justify-between">
                      <span>{i + 1}. {r.criterion}</span>
                      <span className="text-ink-subtle">{r.maxPoints} pt</span>
                    </div>
                    <p className="text-ink-muted text-[11px] mt-0.5 leading-snug">{r.description}</p>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
