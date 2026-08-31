'use client';

import React, { useState } from 'react';
import { Card, Button, Badge } from '@acepharm/ui';
import { X, Search, Activity, Stethoscope, FileText } from 'lucide-react';

interface ClinicalReferenceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ClinicalReferenceModal: React.FC<ClinicalReferenceModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'ranges' | 'formulas' | 'tdm'>('ranges');
  const [search, setSearch] = useState('');

  if (!isOpen) return null;

  const labRanges = [
    { name: 'Sodium (Na+)', range: '135 – 145 mmol/L', clinical: 'Hyponatraemia risk with SSRIs, thiazides, carbamazepine' },
    { name: 'Potassium (K+)', range: '3.5 – 5.0 mmol/L', clinical: 'Hyperkalaemia risk with ACEi, ARBs, spironolactone, amiloride' },
    { name: 'Serum Creatinine', range: '60 – 120 µmol/L', clinical: 'Baseline renal marker used in Cockcroft-Gault calculations' },
    { name: 'eGFR', range: '> 90 mL/min/1.73m²', clinical: '< 30 mL/min requires major dose reductions for renally cleared drugs' },
    { name: 'Serum Urea', range: '2.5 – 7.8 mmol/L', clinical: 'Elevated in dehydration, renal impairment, upper GI bleeds' },
    { name: 'ALT (Alanine Aminotransferase)', range: '10 – 40 IU/L', clinical: 'Discontinue statins if ALT exceeds 3× upper limit of normal (> 120 IU/L)' },
    { name: 'HbA1c', range: '< 48 mmol/mol (6.5%)', clinical: 'Target for uncomplicated Type 2 Diabetes; 53 mmol/mol if on hypoglycaemic drug' },
    { name: 'Platelets', range: '150 – 400 × 10⁹/L', clinical: 'Thrombocytopaenia risk with heparin, methotrexate, clopidogrel' },
    { name: 'White Blood Cell (WBC)', range: '4.0 – 11.0 × 10⁹/L', clinical: 'Neutropenia / agranulocytosis risk with Clozapine, Carbimazole, Methotrexate' },
  ];

  const tdmRanges = [
    { drug: 'Lithium', range: '0.4 – 1.0 mmol/L (0.8–1.0 for acute mania)', timing: '12 hours post-dose (trough)' },
    { drug: 'Digoxin', range: '0.5 – 0.9 µg/L (heart failure) / 0.8 – 2.0 µg/L (AF)', timing: 'At least 6 hours post-dose' },
    { drug: 'Theophylline', range: '10 – 20 mg/L', timing: '4–6 hours post oral modified-release dose' },
    { drug: 'Phenytoin', range: '10 – 20 mg/L (Total serum)', timing: 'Trough level immediately prior to next dose' },
    { drug: 'Gentamicin (Multiple Daily)', range: 'Peak: 5–10 mg/L, Trough: < 2 mg/L (< 1 mg/L for endocarditis)', timing: 'Peak: 1 hr post-infusion; Trough: right before next dose' },
    { drug: 'Vancomycin', range: 'Trough: 10 – 15 mg/L (15 – 20 mg/L in severe/MRSA infections)', timing: 'Immediately prior to next dose' },
  ];

  const formulas = [
    { name: 'Cockcroft-Gault Equation (CrCl)', formula: 'CrCl (mL/min) = [(140 - Age) × Weight (kg) × Constant] / Serum Creatinine (µmol/L)', note: 'Constant = 1.23 for males, 1.04 for females. Use Ideal Body Weight if BMI > 30.' },
    { name: 'Ideal Body Weight (IBW) Devine Formula', formula: 'Male: 50 kg + 2.3 kg per inch over 5 ft | Female: 45.5 kg + 2.3 kg per inch over 5 ft', note: 'Essential for hydrophilic drug dosing calculations in obesity.' },
    { name: 'Infusion Rate Conversion', formula: 'Drops/min = [Total Volume (mL) × Drop Factor (drops/mL)] / Time (minutes)', note: 'Standard IV giving set = 20 drops/mL; blood set = 15 drops/mL.' },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-ink/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-surface border border-border rounded-card shadow-modal max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-5 border-b border-border flex items-center justify-between bg-canvas/60">
          <div className="flex items-center gap-2">
            <Stethoscope className="w-5 h-5 text-indigo" />
            <h2 className="text-base font-bold text-ink">GPhC Clinical Reference & Lab Ranges</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-btn text-slate hover:text-ink transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-border px-5 gap-4 bg-surface text-xs font-semibold">
          <button
            onClick={() => setActiveTab('ranges')}
            className={`py-3 border-b-2 transition-colors ${activeTab === 'ranges' ? 'border-indigo text-indigo' : 'border-transparent text-slate hover:text-ink'}`}
          >
            Standard Biochemical Ranges
          </button>
          <button
            onClick={() => setActiveTab('tdm')}
            className={`py-3 border-b-2 transition-colors ${activeTab === 'tdm' ? 'border-indigo text-indigo' : 'border-transparent text-slate hover:text-ink'}`}
          >
            Therapeutic Drug Monitoring (TDM)
          </button>
          <button
            onClick={() => setActiveTab('formulas')}
            className={`py-3 border-b-2 transition-colors ${activeTab === 'formulas' ? 'border-indigo text-indigo' : 'border-transparent text-slate hover:text-ink'}`}
          >
            Calculation Formulas
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4">
          {activeTab === 'ranges' && (
            <div className="space-y-3">
              {labRanges.map((lab) => (
                <div key={lab.name} className="p-3.5 rounded-btn bg-canvas border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <span className="font-bold text-ink text-xs sm:text-sm">{lab.name}</span>
                    <p className="text-[11px] text-slate mt-0.5">{lab.clinical}</p>
                  </div>
                  <span className="font-mono text-xs font-bold text-indigo bg-indigo-wash px-2.5 py-1 rounded-full shrink-0">
                    {lab.range}
                  </span>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'tdm' && (
            <div className="space-y-3">
              {tdmRanges.map((tdm) => (
                <div key={tdm.drug} className="p-3.5 rounded-btn bg-canvas border border-border space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-ink text-xs sm:text-sm">{tdm.drug}</span>
                    <span className="font-mono text-xs font-bold text-teal bg-teal-light px-2.5 py-0.5 rounded-full">
                      {tdm.range}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate"><strong>Sampling Protocol:</strong> {tdm.timing}</p>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'formulas' && (
            <div className="space-y-3">
              {formulas.map((f) => (
                <div key={f.name} className="p-4 rounded-btn bg-canvas border border-border space-y-2">
                  <span className="font-bold text-ink text-xs sm:text-sm">{f.name}</span>
                  <div className="font-mono text-xs font-semibold text-indigo bg-indigo-wash p-2.5 rounded-btn border border-indigo-200">
                    {f.formula}
                  </div>
                  <p className="text-[11px] text-slate">{f.note}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border bg-canvas/40 text-center text-[11px] text-slate-light">
          GPhC Assessment Standard Values &bull; Formatted for rapid exam reference
        </div>
      </div>
    </div>
  );
};
