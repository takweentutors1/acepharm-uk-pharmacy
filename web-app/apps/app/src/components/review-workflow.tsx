'use client';

import React, { useState } from 'react';
import { Button, Badge, Card } from '@acepharm/ui';
import { 
  Stethoscope, 
  GraduationCap, 
  BookOpenCheck, 
  CheckCircle2, 
  AlertTriangle, 
  ArrowRight, 
  Send,
  RotateCcw,
  ShieldCheck,
  HelpCircle
} from 'lucide-react';

export type QuestionStatus =
  | 'idea'
  | 'draft'
  | 'awaiting_clinical_review'
  | 'changes_requested'
  | 'awaiting_editorial_review'
  | 'approved'
  | 'scheduled'
  | 'published'
  | 'update_required'
  | 'suspended'
  | 'archived';

export function ReviewWorkflowModal({
  questionId = 'ACP-CV-0012',
  initialStatus = 'awaiting_clinical_review' as QuestionStatus,
  onStatusChange,
}: {
  questionId?: string;
  initialStatus?: QuestionStatus;
  onStatusChange?: (newStatus: QuestionStatus) => void;
}) {
  const [currentStatus, setCurrentStatus] = useState<QuestionStatus>(initialStatus);
  const [selectedTab, setSelectedTab] = useState<'clinical' | 'educational' | 'editorial'>('clinical');
  const [feedbackNotes, setFeedbackNotes] = useState('');
  const [hasConflict, setHasConflict] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // 1. Clinical Checklist State
  const [clinicalChecklist, setClinicalChecklist] = useState({
    clinicalAccuracyVerified: false,
    singleDefinitiveAnswer: false,
    distractorsClinicallyPlausible: false,
    perOptionRationalesAccurate: false,
    dosingAndCalculationsChecked: false,
    noPatientHarmOrAmbiguity: false,
  });

  // 2. Educational Checklist State
  const [educationalChecklist, setEducationalChecklist] = useState({
    alignedToGPhCFramework: false,
    appropriateCognitiveLevel: false,
    leadInUnambiguous: false,
    stemContainsRealisticContext: false,
    explanationHasClearTakeaway: false,
  });

  // 3. Editorial Checklist State
  const [editorialChecklist, setEditorialChecklist] = useState({
    britishEnglishGrammarSpelling: false,
    consistentFormattingAndStyle: false,
    guidelineCitationsFormatted: false,
    tablesProperlyStructured: false,
    disclaimerAndToneCompliant: false,
  });

  const isClinicalComplete = Object.values(clinicalChecklist).every(Boolean);
  const isEducationalComplete = Object.values(educationalChecklist).every(Boolean);
  const isEditorialComplete = Object.values(editorialChecklist).every(Boolean);

  const handleClinicalCheck = (key: keyof typeof clinicalChecklist) => {
    setClinicalChecklist((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleEducationalCheck = (key: keyof typeof educationalChecklist) => {
    setEducationalChecklist((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleEditorialCheck = (key: keyof typeof editorialChecklist) => {
    setEditorialChecklist((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleApproveClinical = () => {
    if (!isClinicalComplete) {
      setStatusMessage({ type: 'error', text: 'All clinical review criteria must be ticked before approval.' });
      return;
    }
    setCurrentStatus('awaiting_editorial_review');
    setStatusMessage({ type: 'success', text: 'Clinical review approved! Transitioned to awaiting editorial review.' });
    onStatusChange?.('awaiting_editorial_review');
  };

  const handleApproveEducational = () => {
    if (!isEducationalComplete) {
      setStatusMessage({ type: 'error', text: 'All educational review criteria must be ticked before approval.' });
      return;
    }
    setStatusMessage({ type: 'success', text: 'Educational review sign-off recorded!' });
  };

  const handleApproveEditorial = () => {
    if (!isEditorialComplete) {
      setStatusMessage({ type: 'error', text: 'All editorial/copy review criteria must be ticked before approval.' });
      return;
    }
    setCurrentStatus('approved');
    setStatusMessage({ type: 'success', text: 'Editorial review approved! Question is now APPROVED and ready to publish.' });
    onStatusChange?.('approved');
  };

  const handleRequestChanges = () => {
    if (!feedbackNotes.trim()) {
      setStatusMessage({ type: 'error', text: 'Please provide constructive feedback notes explaining what changes are requested.' });
      return;
    }
    setCurrentStatus('changes_requested');
    setStatusMessage({ type: 'success', text: 'Changes requested! Question returned to author with feedback.' });
    onStatusChange?.('changes_requested');
  };

  return (
    <div className="space-y-6">
      {/* Header & State Ribbon */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-indigo/10 text-indigo">
              <ShieldCheck className="w-5 h-5" />
            </span>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-ink">
                Review Status State Machine
              </h1>
              <span className="text-xs text-slate font-medium">
                Governing question <span className="font-mono text-ink font-semibold">{questionId}</span>
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge
            variant={
              currentStatus === 'published' || currentStatus === 'approved'
                ? 'success'
                : currentStatus === 'changes_requested'
                ? 'danger'
                : 'warning'
            }
            className="text-xs uppercase font-semibold"
          >
            {currentStatus.replace(/_/g, ' ')}
          </Badge>
        </div>
      </div>

      {/* State Machine Visualizer */}
      <Card className="p-4 bg-surface border-border overflow-x-auto">
        <div className="flex items-center justify-between min-w-[650px] text-xs">
          <div className={`flex flex-col items-center p-2 rounded ${currentStatus === 'draft' ? 'bg-indigo/10 text-indigo font-bold' : 'text-slate'}`}>
            <span className="w-6 h-6 rounded-full border border-current flex items-center justify-center mb-1 text-[11px]">1</span>
            <span>Draft / Authoring</span>
          </div>
          <ArrowRight className="w-4 h-4 text-border" />

          <div className={`flex flex-col items-center p-2 rounded ${currentStatus === 'awaiting_clinical_review' ? 'bg-indigo/10 text-indigo font-bold' : 'text-slate'}`}>
            <span className="w-6 h-6 rounded-full border border-current flex items-center justify-center mb-1 text-[11px]">2</span>
            <span>Clinical Review</span>
          </div>
          <ArrowRight className="w-4 h-4 text-border" />

          <div className={`flex flex-col items-center p-2 rounded ${currentStatus === 'awaiting_editorial_review' ? 'bg-indigo/10 text-indigo font-bold' : 'text-slate'}`}>
            <span className="w-6 h-6 rounded-full border border-current flex items-center justify-center mb-1 text-[11px]">3</span>
            <span>Editorial Review</span>
          </div>
          <ArrowRight className="w-4 h-4 text-border" />

          <div className={`flex flex-col items-center p-2 rounded ${currentStatus === 'approved' || currentStatus === 'published' ? 'bg-teal/10 text-teal font-bold' : 'text-slate'}`}>
            <span className="w-6 h-6 rounded-full border border-current flex items-center justify-center mb-1 text-[11px]">4</span>
            <span>Approved / Live</span>
          </div>
        </div>
      </Card>

      {statusMessage && (
        <div
          className={`p-3.5 rounded-card text-xs font-medium flex items-center gap-2 ${
            statusMessage.type === 'success'
              ? 'bg-teal/10 border border-teal/30 text-teal'
              : 'bg-rose-50 border border-rose-200 text-rose-600'
          }`}
        >
          {statusMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 shrink-0" />
          )}
          {statusMessage.text}
        </div>
      )}

      {/* Review Checklists Container */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: The 3 Checklists */}
        <div className="lg:col-span-8 space-y-4">
          <div className="flex border-b border-border">
            <button
              type="button"
              onClick={() => setSelectedTab('clinical')}
              className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-all flex items-center gap-2 ${
                selectedTab === 'clinical'
                  ? 'border-indigo text-indigo'
                  : 'border-transparent text-slate hover:text-ink'
              }`}
            >
              <Stethoscope className="w-4 h-4" /> 1. Clinical Review
              {isClinicalComplete && <Badge variant="success" className="text-[10px]">Ready</Badge>}
            </button>

            <button
              type="button"
              onClick={() => setSelectedTab('educational')}
              className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-all flex items-center gap-2 ${
                selectedTab === 'educational'
                  ? 'border-indigo text-indigo'
                  : 'border-transparent text-slate hover:text-ink'
              }`}
            >
              <GraduationCap className="w-4 h-4" /> 2. Educational Review
              {isEducationalComplete && <Badge variant="success" className="text-[10px]">Ready</Badge>}
            </button>

            <button
              type="button"
              onClick={() => setSelectedTab('editorial')}
              className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-all flex items-center gap-2 ${
                selectedTab === 'editorial'
                  ? 'border-indigo text-indigo'
                  : 'border-transparent text-slate hover:text-ink'
              }`}
            >
              <BookOpenCheck className="w-4 h-4" /> 3. Editorial & Copy
              {isEditorialComplete && <Badge variant="success" className="text-[10px]">Ready</Badge>}
            </button>
          </div>

          {/* 1. Clinical Checklist (Real Tick-Boxes) */}
          {selectedTab === 'clinical' && (
            <Card className="p-5 bg-surface border-border space-y-4">
              <div>
                <h3 className="text-sm font-bold text-ink">Clinical Pharmacist Verification Checklist</h3>
                <p className="text-xs text-slate">Section 7.4 quality baseline — must be verified by a registered pharmacist.</p>
              </div>

              <div className="space-y-3 pt-2">
                <label className="flex items-start gap-3 p-2.5 rounded-lg border border-border bg-canvas/40 hover:bg-canvas cursor-pointer">
                  <input
                    type="checkbox"
                    checked={clinicalChecklist.clinicalAccuracyVerified}
                    onChange={() => handleClinicalCheck('clinicalAccuracyVerified')}
                    className="mt-0.5 h-4 w-4 rounded text-indigo focus:ring-indigo cursor-pointer"
                  />
                  <div className="text-xs">
                    <span className="font-semibold text-ink block">Clinical Accuracy & Guidelines Alignment</span>
                    <span className="text-slate">Therapy recommendation aligns unequivocally with current BNF, NICE, and SPCs.</span>
                  </div>
                </label>

                <label className="flex items-start gap-3 p-2.5 rounded-lg border border-border bg-canvas/40 hover:bg-canvas cursor-pointer">
                  <input
                    type="checkbox"
                    checked={clinicalChecklist.singleDefinitiveAnswer}
                    onChange={() => handleClinicalCheck('singleDefinitiveAnswer')}
                    className="mt-0.5 h-4 w-4 rounded text-indigo focus:ring-indigo cursor-pointer"
                  />
                  <div className="text-xs">
                    <span className="font-semibold text-ink block">Single Definitive Correct Answer</span>
                    <span className="text-slate">Exactly one answer is clinically optimal; no dual-correct edge cases or unresolvable disputes.</span>
                  </div>
                </label>

                <label className="flex items-start gap-3 p-2.5 rounded-lg border border-border bg-canvas/40 hover:bg-canvas cursor-pointer">
                  <input
                    type="checkbox"
                    checked={clinicalChecklist.distractorsClinicallyPlausible}
                    onChange={() => handleClinicalCheck('distractorsClinicallyPlausible')}
                    className="mt-0.5 h-4 w-4 rounded text-indigo focus:ring-indigo cursor-pointer"
                  />
                  <div className="text-xs">
                    <span className="font-semibold text-ink block">Clinically Plausible Distractors</span>
                    <span className="text-slate">Distractors reflect common real-world errors or near-misses, not arbitrary impossible options.</span>
                  </div>
                </label>

                <label className="flex items-start gap-3 p-2.5 rounded-lg border border-border bg-canvas/40 hover:bg-canvas cursor-pointer">
                  <input
                    type="checkbox"
                    checked={clinicalChecklist.perOptionRationalesAccurate}
                    onChange={() => handleClinicalCheck('perOptionRationalesAccurate')}
                    className="mt-0.5 h-4 w-4 rounded text-indigo focus:ring-indigo cursor-pointer"
                  />
                  <div className="text-xs">
                    <span className="font-semibold text-ink block">Per-Option Rationales Fully Vetted</span>
                    <span className="text-slate">Every option explanation correctly identifies why that specific agent is contraindicated or sub-optimal.</span>
                  </div>
                </label>

                <label className="flex items-start gap-3 p-2.5 rounded-lg border border-border bg-canvas/40 hover:bg-canvas cursor-pointer">
                  <input
                    type="checkbox"
                    checked={clinicalChecklist.dosingAndCalculationsChecked}
                    onChange={() => handleClinicalCheck('dosingAndCalculationsChecked')}
                    className="mt-0.5 h-4 w-4 rounded text-indigo focus:ring-indigo cursor-pointer"
                  />
                  <div className="text-xs">
                    <span className="font-semibold text-ink block">Doses, Units & Calculations Verified</span>
                    <span className="text-slate">Renal cut-offs, weight adjustments, units (mg vs mcg), and tolerances are mathematically accurate.</span>
                  </div>
                </label>

                <label className="flex items-start gap-3 p-2.5 rounded-lg border border-border bg-canvas/40 hover:bg-canvas cursor-pointer">
                  <input
                    type="checkbox"
                    checked={clinicalChecklist.noPatientHarmOrAmbiguity}
                    onChange={() => handleClinicalCheck('noPatientHarmOrAmbiguity')}
                    className="mt-0.5 h-4 w-4 rounded text-indigo focus:ring-indigo cursor-pointer"
                  />
                  <div className="text-xs">
                    <span className="font-semibold text-ink block">Patient Safety & Unambiguous Framing</span>
                    <span className="text-slate">No dangerous clinical misinformation; prompt is clear and clinically sound.</span>
                  </div>
                </label>
              </div>

              <div className="pt-3 border-t border-border flex justify-end">
                <Button
                  variant="primary"
                  size="sm"
                  disabled={!isClinicalComplete}
                  onClick={handleApproveClinical}
                  className="flex items-center gap-1.5 text-xs shadow-sm"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" /> Sign-Off Clinical Review
                </Button>
              </div>
            </Card>
          )}

          {/* 2. Educational Checklist (Real Tick-Boxes) */}
          {selectedTab === 'educational' && (
            <Card className="p-5 bg-surface border-border space-y-4">
              <div>
                <h3 className="text-sm font-bold text-ink">Educational Pedagogy & GPhC Framework Checklist</h3>
                <p className="text-xs text-slate">Verifies cognitive difficulty, learning outcomes, and assessment standards.</p>
              </div>

              <div className="space-y-3 pt-2">
                <label className="flex items-start gap-3 p-2.5 rounded-lg border border-border bg-canvas/40 hover:bg-canvas cursor-pointer">
                  <input
                    type="checkbox"
                    checked={educationalChecklist.alignedToGPhCFramework}
                    onChange={() => handleEducationalCheck('alignedToGPhCFramework')}
                    className="mt-0.5 h-4 w-4 rounded text-indigo focus:ring-indigo cursor-pointer"
                  />
                  <div className="text-xs">
                    <span className="font-semibold text-ink block">GPhC Framework Alignment</span>
                    <span className="text-slate">Maps directly to GPhC Registration Assessment Framework competencies and indicative syllabus.</span>
                  </div>
                </label>

                <label className="flex items-start gap-3 p-2.5 rounded-lg border border-border bg-canvas/40 hover:bg-canvas cursor-pointer">
                  <input
                    type="checkbox"
                    checked={educationalChecklist.appropriateCognitiveLevel}
                    onChange={() => handleEducationalCheck('appropriateCognitiveLevel')}
                    className="mt-0.5 h-4 w-4 rounded text-indigo focus:ring-indigo cursor-pointer"
                  />
                  <div className="text-xs">
                    <span className="font-semibold text-ink block">Cognitive Rigour (Application & Synthesis)</span>
                    <span className="text-slate">Tests clinical application, diagnosis, or problem-solving rather than isolated trivial recall.</span>
                  </div>
                </label>

                <label className="flex items-start gap-3 p-2.5 rounded-lg border border-border bg-canvas/40 hover:bg-canvas cursor-pointer">
                  <input
                    type="checkbox"
                    checked={educationalChecklist.leadInUnambiguous}
                    onChange={() => handleEducationalCheck('leadInUnambiguous')}
                    className="mt-0.5 h-4 w-4 rounded text-indigo focus:ring-indigo cursor-pointer"
                  />
                  <div className="text-xs">
                    <span className="font-semibold text-ink block">Unambiguous Lead-In Prompt</span>
                    <span className="text-slate">Clear instruction without double negatives or "Which of the following is NOT...".</span>
                  </div>
                </label>

                <label className="flex items-start gap-3 p-2.5 rounded-lg border border-border bg-canvas/40 hover:bg-canvas cursor-pointer">
                  <input
                    type="checkbox"
                    checked={educationalChecklist.stemContainsRealisticContext}
                    onChange={() => handleEducationalCheck('stemContainsRealisticContext')}
                    className="mt-0.5 h-4 w-4 rounded text-indigo focus:ring-indigo cursor-pointer"
                  />
                  <div className="text-xs">
                    <span className="font-semibold text-ink block">Realistic Patient Context</span>
                    <span className="text-slate">Scenario gives genuine demographic and clinical parameters without giving away the answer.</span>
                  </div>
                </label>

                <label className="flex items-start gap-3 p-2.5 rounded-lg border border-border bg-canvas/40 hover:bg-canvas cursor-pointer">
                  <input
                    type="checkbox"
                    checked={educationalChecklist.explanationHasClearTakeaway}
                    onChange={() => handleEducationalCheck('explanationHasClearTakeaway')}
                    className="mt-0.5 h-4 w-4 rounded text-indigo focus:ring-indigo cursor-pointer"
                  />
                  <div className="text-xs">
                    <span className="font-semibold text-ink block">Memorable Takeaway Learning Point</span>
                    <span className="text-slate">Summary takeaway provides a standalone learning point to convert mistakes into mastery.</span>
                  </div>
                </label>
              </div>

              <div className="pt-3 border-t border-border flex justify-end">
                <Button
                  variant="primary"
                  size="sm"
                  disabled={!isEducationalComplete}
                  onClick={handleApproveEducational}
                  className="flex items-center gap-1.5 text-xs shadow-sm"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" /> Sign-Off Educational Review
                </Button>
              </div>
            </Card>
          )}

          {/* 3. Editorial / Copy Review Checklist (Real Tick-Boxes) */}
          {selectedTab === 'editorial' && (
            <Card className="p-5 bg-surface border-border space-y-4">
              <div>
                <h3 className="text-sm font-bold text-ink">Copy Editing & British English Standards Checklist</h3>
                <p className="text-xs text-slate">Ensures compliance with UK grammatical rules and style guide tokens.</p>
              </div>

              <div className="space-y-3 pt-2">
                <label className="flex items-start gap-3 p-2.5 rounded-lg border border-border bg-canvas/40 hover:bg-canvas cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editorialChecklist.britishEnglishGrammarSpelling}
                    onChange={() => handleEditorialCheck('britishEnglishGrammarSpelling')}
                    className="mt-0.5 h-4 w-4 rounded text-indigo focus:ring-indigo cursor-pointer"
                  />
                  <div className="text-xs">
                    <span className="font-semibold text-ink block">British English (en-GB) Strict Spelling</span>
                    <span className="text-slate">e.g. paediatric, hypokalaemia, practise (verb)/practice (noun), licence, oedema.</span>
                  </div>
                </label>

                <label className="flex items-start gap-3 p-2.5 rounded-lg border border-border bg-canvas/40 hover:bg-canvas cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editorialChecklist.consistentFormattingAndStyle}
                    onChange={() => handleEditorialCheck('consistentFormattingAndStyle')}
                    className="mt-0.5 h-4 w-4 rounded text-indigo focus:ring-indigo cursor-pointer"
                  />
                  <div className="text-xs">
                    <span className="font-semibold text-ink block">Standardised Drug Naming & Units</span>
                    <span className="text-slate">rINN drug names throughout (e.g. Paracetamol, Salbutamol); correct units (mg, mL, mmol/L).</span>
                  </div>
                </label>

                <label className="flex items-start gap-3 p-2.5 rounded-lg border border-border bg-canvas/40 hover:bg-canvas cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editorialChecklist.guidelineCitationsFormatted}
                    onChange={() => handleEditorialCheck('guidelineCitationsFormatted')}
                    className="mt-0.5 h-4 w-4 rounded text-indigo focus:ring-indigo cursor-pointer"
                  />
                  <div className="text-xs">
                    <span className="font-semibold text-ink block">Guideline Citation Formatting</span>
                    <span className="text-slate">Accurate BNF edition / NICE guidance numbers (e.g. NICE NG136) formatted consistently.</span>
                  </div>
                </label>

                <label className="flex items-start gap-3 p-2.5 rounded-lg border border-border bg-canvas/40 hover:bg-canvas cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editorialChecklist.tablesProperlyStructured}
                    onChange={() => handleEditorialCheck('tablesProperlyStructured')}
                    className="mt-0.5 h-4 w-4 rounded text-indigo focus:ring-indigo cursor-pointer"
                  />
                  <div className="text-xs">
                    <span className="font-semibold text-ink block">Accessible Table Markdown</span>
                    <span className="text-slate">Header row and delimiter properly defined for responsive horizontal containment.</span>
                  </div>
                </label>

                <label className="flex items-start gap-3 p-2.5 rounded-lg border border-border bg-canvas/40 hover:bg-canvas cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editorialChecklist.disclaimerAndToneCompliant}
                    onChange={() => handleEditorialCheck('disclaimerAndToneCompliant')}
                    className="mt-0.5 h-4 w-4 rounded text-indigo focus:ring-indigo cursor-pointer"
                  />
                  <div className="text-xs">
                    <span className="font-semibold text-ink block">Brand Voice & Compliance</span>
                    <span className="text-slate">No unverified exam success claims, no "mastered" terminology, strictly educational.</span>
                  </div>
                </label>
              </div>

              <div className="pt-3 border-t border-border flex justify-end">
                <Button
                  variant="primary"
                  size="sm"
                  disabled={!isEditorialComplete}
                  onClick={handleApproveEditorial}
                  className="flex items-center gap-1.5 text-xs shadow-sm"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" /> Sign-Off Editorial Review
                </Button>
              </div>
            </Card>
          )}
        </div>

        {/* Right Column: Request Changes & Governance Meta */}
        <div className="lg:col-span-4 space-y-4">
          <Card className="p-5 bg-surface border-border shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-ink">Reviewer Feedback & Actions</h3>

            <div>
              <label className="text-xs font-semibold text-slate block mb-1">
                Editorial / Clinical Feedback Notes
              </label>
              <textarea
                value={feedbackNotes}
                onChange={(e) => setFeedbackNotes(e.target.value)}
                rows={3}
                placeholder="Detail required updates or clinical clarifications for the author..."
                className="w-full p-2.5 text-xs bg-canvas border border-border rounded-input text-ink outline-none focus:ring-2 focus:ring-indigo"
              />
            </div>

            <div className="p-3 rounded-lg bg-canvas border border-border space-y-2">
              <label className="flex items-center gap-2 text-xs font-medium text-ink cursor-pointer">
                <input
                  type="checkbox"
                  checked={hasConflict}
                  onChange={(e) => setHasConflict(e.target.checked)}
                  className="rounded text-indigo focus:ring-indigo cursor-pointer"
                />
                <span>Conflict of Interest Declaration</span>
              </label>
              <p className="text-[11px] text-slate">
                Confirm reviewer has no institutional conflicts regarding author or specific exam questions.
              </p>
            </div>

            <div className="pt-2 border-t border-border flex flex-col gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRequestChanges}
                className="w-full flex items-center justify-center gap-1.5 text-xs text-rose-600 border-rose-200 hover:bg-rose-50"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Request Changes from Author
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
