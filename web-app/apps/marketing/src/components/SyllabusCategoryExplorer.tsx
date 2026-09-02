import React, { useState, useMemo } from 'react';
import { Card, Badge, Button } from '@acepharm/ui';

export interface CategoryInfo {
  id: string;
  name: string;
  weighting: 'High' | 'Medium' | 'Low';
  bnfChapter: string;
  questionCount: number;
  description: string;
  keyTopics: string[];
}

const GPHC_CATEGORIES: CategoryInfo[] = [
  {
    id: 'cardio',
    name: 'Cardiovascular System',
    weighting: 'High',
    bnfChapter: 'BNF Chapter 2',
    questionCount: 160,
    description: 'Hypertension, heart failure, arrhythmias, anticoagulation, lipid modification and acute coronary syndromes.',
    keyTopics: ['NICE NG136', 'DOAC Dosing', 'Heart Failure Stepwise Therapy', 'Warfarin & INR Monitoring'],
  },
  {
    id: 'resp',
    name: 'Respiratory System',
    weighting: 'High',
    bnfChapter: 'BNF Chapter 3',
    questionCount: 140,
    description: 'Asthma and COPD management guidelines, inhaler device technique, and acute exacerbation protocols.',
    keyTopics: ['BTS/SIGN Guidelines', 'GOLD COPD Criteria', 'Inhaler Technique Calibration', 'Theophylline Monitoring'],
  },
  {
    id: 'cns',
    name: 'Central Nervous System',
    weighting: 'High',
    bnfChapter: 'BNF Chapter 4',
    questionCount: 155,
    description: 'Depression, anxiety, psychosis, Parkinson’s disease, epilepsy management, and substance misuse services.',
    keyTopics: ['Valproate Pregnancy Prevention', 'Lithium Toxicity', 'Antidepressant Switching', 'Parkinsonian Motor Symptoms'],
  },
  {
    id: 'infection',
    name: 'Infections & Antimicrobial Stewardship',
    weighting: 'High',
    bnfChapter: 'BNF Chapter 5',
    questionCount: 145,
    description: 'Antibiotic selection, sepsis screening, UKHSA primary care guidance, antifungal and antiviral regimens.',
    keyTopics: ['Gentamicin & Vancomycin TDM', 'UKHSA Stewardship Guidance', 'Penicillin Allergy Stratification', 'Clostridioides difficile'],
  },
  {
    id: 'endocrine',
    name: 'Endocrine & Diabetes',
    weighting: 'High',
    bnfChapter: 'BNF Chapter 6',
    questionCount: 130,
    description: 'Type 1 and Type 2 Diabetes regimens, thyroid disease, corticosteroids, and adrenal crisis management.',
    keyTopics: ['NICE NG28 Glycaemic Algorithms', 'Insulin Safety & Conversions', 'Sick Day Rules', 'Steroid Emergency Cards'],
  },
  {
    id: 'calc',
    name: 'Pharmaceutical Calculations (Paper 1)',
    weighting: 'High',
    bnfChapter: 'GPhC Paper 1 Focus',
    questionCount: 180,
    description: 'Dosages, dilution, concentrations, infusion rates, molecular weights, displacement volumes and pharmacokinetics.',
    keyTopics: ['Infusion Rate Calculations', 'Alligation & Mixing', 'Paediatric BSA Dosing', 'Displacement Values'],
  },
  {
    id: 'law',
    name: 'Pharmacy Law, Ethics & Practice',
    weighting: 'High',
    bnfChapter: 'Medicines Ethics & Practice (MEP)',
    questionCount: 120,
    description: 'Controlled Drugs schedules, emergency supplies, responsible pharmacist regulations, and fitness to practise.',
    keyTopics: ['Misuse of Drugs Regs 2001', 'Emergency Supply Rules', 'Responsible Pharmacist Absence', 'Veterinary Prescriptions'],
  },
  {
    id: 'gi',
    name: 'Gastrointestinal System',
    weighting: 'Medium',
    bnfChapter: 'BNF Chapter 1',
    questionCount: 95,
    description: 'Dyspepsia, peptic ulcer disease, inflammatory bowel disease (IBD), stoma care, and liver impairment.',
    keyTopics: ['PPI Long-Term Risks', 'H. pylori Eradication', 'IBD Biologics & Monitoring', 'Laxative Stepped Management'],
  },
  {
    id: 'gu',
    name: 'Genito-Urinary System',
    weighting: 'Medium',
    bnfChapter: 'BNF Chapter 7',
    questionCount: 80,
    description: 'Urinary tract infections, benign prostatic hyperplasia, erectile dysfunction, and contraception counselling.',
    keyTopics: ['Emergency Hormonal Contraception', 'BPH 5-ARI & Alpha Blockers', 'Catheter Maintenance Protocols', 'Recurrent UTI Guidance'],
  },
  {
    id: 'malignancy',
    name: 'Malignant Disease & Immunosuppression',
    weighting: 'Medium',
    bnfChapter: 'BNF Chapter 8',
    questionCount: 75,
    description: 'Oral anticancer medicines safety, febrile neutropenia, antiemetic regimens, and DMARD toxicity.',
    keyTopics: ['Oral Methotrexate Once-Weekly Alert', 'Febrile Neutropenia Flags', 'Chemotherapy-Induced Nausea', 'Biologic Screening'],
  },
  {
    id: 'nutrition',
    name: 'Nutrition & Blood Disorders',
    weighting: 'Medium',
    bnfChapter: 'BNF Chapter 9',
    questionCount: 70,
    description: 'Anaemias, electrolyte disorders, parenteral nutrition requirements, and fluid replacement protocols.',
    keyTopics: ['Oral vs IV Iron Therapy', 'Hypokalaemia Management', 'Vitamin D Deficiency Protocols', 'Refeeding Syndrome Flags'],
  },
  {
    id: 'msk',
    name: 'Musculoskeletal & Joint Diseases',
    weighting: 'Medium',
    bnfChapter: 'BNF Chapter 10',
    questionCount: 65,
    description: 'Osteoarthritis, rheumatoid arthritis, gout prophylaxis/acute flares, osteoporosis and bone health.',
    keyTopics: ['NSAID Gastro & Renal Risks', 'Allopurinol Initiation & Dosing', 'Bisphosphonate Counselling', 'DMARD Monitoring Intervals'],
  },
  {
    id: 'eye',
    name: 'Eye & Ophthalmic Conditions',
    weighting: 'Low',
    bnfChapter: 'BNF Chapter 11',
    questionCount: 45,
    description: 'Glaucoma topical therapies, eye drop administration technique, conjunctivitis, and red flag referrals.',
    keyTopics: ['Prostaglandin Analogues Counselling', 'Beta-Blocker Eye Drop Contraindications', 'Dry Eye Stepped Care', 'Red Eye Triage'],
  },
  {
    id: 'ent',
    name: 'Ear, Nose & Oropharynx',
    weighting: 'Low',
    bnfChapter: 'BNF Chapter 12',
    questionCount: 40,
    description: 'Otitis externa, allergic rhinitis, oral candidiasis, and community pharmacy minor ailment protocols.',
    keyTopics: ['Intranasal Steroid Technique', 'Otitis Externa Ear Drops', 'Oral Thrush Treatments', 'Pharmacy First Earache Protocols'],
  },
  {
    id: 'skin',
    name: 'Skin & Dermatology',
    weighting: 'Medium',
    bnfChapter: 'BNF Chapter 13',
    questionCount: 85,
    description: 'Eczema emollients, topical steroid potencies, acne stepped care, psoriasis, and skin malignancy referral flags.',
    keyTopics: ['Fingertip Units (FTU) Guidance', 'Topical Corticosteroid Potencies', 'Emollient Fire Hazards', 'Oral Isotretinoin PPP'],
  },
  {
    id: 'anaesthesia',
    name: 'Anaesthesia & Intensive Care',
    weighting: 'Low',
    bnfChapter: 'BNF Chapter 15',
    questionCount: 35,
    description: 'Local anaesthetic maximum doses, neuromuscular blockade principles, and pre-operative medication holding.',
    keyTopics: ['Lidocaine Adrenaline Exclusions', 'Pre-op Anticoagulant Holding Times', 'Sedation Reversal Protocols', 'Malignant Hyperthermia'],
  },
  {
    id: 'paediatrics',
    name: 'Paediatrics & Neonatal Dosing',
    weighting: 'High',
    bnfChapter: 'BNFC & Safety Guidelines',
    questionCount: 90,
    description: 'Age-appropriate formulations, BNFC weight-based dosing, off-label safety, and choking risk mitigation.',
    keyTopics: ['BNFC Off-label Status Verification', 'Liquid Formulations Excipients', 'Paracetamol & Ibuprofen Alternation', 'Neonatal Jaundice Flags'],
  },
  {
    id: 'elderly',
    name: 'Older People & Polypharmacy',
    weighting: 'High',
    bnfChapter: 'Clinical Governance & STOPP/START',
    questionCount: 85,
    description: 'Anticholinergic burden, fall risks, STOPP/START criteria, deprescribing, and renal function estimation in frail adults.',
    keyTopics: ['Anticholinergic Cognitive Burden (ACB)', 'STOPP/START Criteria', 'Cockcroft-Gault vs eGFR Dosing', 'Sedative Fall Risk Mitigation'],
  },
  {
    id: 'otc',
    name: 'Responding to Symptoms & OTC Triage',
    weighting: 'High',
    bnfChapter: 'Pharmacy First & Community Protocols',
    questionCount: 110,
    description: 'Differential diagnosis of common presenting symptoms, OTC licensing restrictions, and Pharmacy First referral triggers.',
    keyTopics: ['Pharmacy First 7 Clinical Pathways', 'POM-to-P Sales Constraints', 'Red Flag Headaches & Chest Pain', 'Pregnancy OTC Suitability'],
  },
];

export default function SyllabusCategoryExplorer() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedWeighting, setSelectedWeighting] = useState<'All' | 'High' | 'Medium' | 'Low'>('All');

  const filteredCategories = useMemo(() => {
    return GPHC_CATEGORIES.filter((cat) => {
      const matchesSearch =
        cat.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cat.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cat.bnfChapter.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cat.keyTopics.some((topic) => topic.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesWeighting = selectedWeighting === 'All' || cat.weighting === selectedWeighting;

      return matchesSearch && matchesWeighting;
    });
  }, [searchTerm, selectedWeighting]);

  const totalFilteredQuestions = useMemo(() => {
    return filteredCategories.reduce((acc, cat) => acc + cat.questionCount, 0);
  }, [filteredCategories]);

  return (
    <div className="space-y-6">
      {/* Header & Filter Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-surface p-4 sm:p-5 rounded-card border border-border shadow-xs">
        {/* Search Input */}
        <div className="w-full sm:w-72">
          <label htmlFor="syllabus-search" className="sr-only">Search GPhC categories</label>
          <input
            id="syllabus-search"
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search topic (e.g., Asthma, DOAC, MEP)..."
            className="w-full text-xs sm:text-sm py-2 px-3 rounded-btn border border-border bg-canvas text-ink placeholder:text-slate-light focus:outline-none focus:ring-2 focus:ring-indigo/20 focus:border-indigo transition-all"
          />
        </div>

        {/* Weighting Pills Filter */}
        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          <span className="text-xs font-semibold text-slate whitespace-nowrap mr-1">GPhC Weighting:</span>
          {(['All', 'High', 'Medium', 'Low'] as const).map((w) => (
            <button
              key={w}
              type="button"
              onClick={() => setSelectedWeighting(w)}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-all border ${
                selectedWeighting === w
                  ? 'bg-indigo text-white border-indigo shadow-xs'
                  : 'bg-canvas border-border text-slate hover:text-ink'
              }`}
            >
              {w}
            </button>
          ))}
        </div>
      </div>

      {/* Dynamic Count Stats */}
      <div className="flex items-center justify-between text-xs text-slate px-1">
        <span>
          Showing <strong>{filteredCategories.length}</strong> of 19 GPhC curriculum categories
        </span>
        <span>
          <strong>{totalFilteredQuestions}</strong> authentic revision scenarios available
        </span>
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCategories.map((cat) => (
          <Card
            key={cat.id}
            className="p-5 bg-surface border border-border hover:border-indigo/50 hover:shadow-card transition-all rounded-card flex flex-col justify-between space-y-4 group"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-mono font-semibold text-slate">
                  {cat.bnfChapter}
                </span>
                <span
                  className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                    cat.weighting === 'High'
                      ? 'bg-rose-50 text-rose-700 border-rose-200'
                      : cat.weighting === 'Medium'
                      ? 'bg-amber-light text-amber border-amber/20'
                      : 'bg-slate-lighter/50 text-slate border-slate-lighter'
                  }`}
                >
                  {cat.weighting} Weight
                </span>
              </div>

              <h3 className="text-base font-bold text-ink group-hover:text-indigo transition-colors leading-tight">
                {cat.name}
              </h3>

              <p className="text-xs text-slate leading-relaxed">
                {cat.description}
              </p>
            </div>

            <div className="space-y-3 pt-3 border-t border-border/60">
              {/* Key topics pill badges */}
              <div className="flex flex-wrap gap-1">
                {cat.keyTopics.map((topic) => (
                  <span
                    key={topic}
                    className="text-[10px] font-medium bg-canvas text-slate border border-border/80 px-2 py-0.5 rounded"
                  >
                    {topic}
                  </span>
                ))}
              </div>

              <div className="flex items-center justify-between text-xs pt-1">
                <span className="font-semibold text-ink font-mono text-[11px]">
                  {cat.questionCount} Questions
                </span>
                <a
                  href="https://app.acepharmexams.co.uk/auth/register"
                  className="text-indigo hover:text-indigo-deep font-bold text-xs inline-flex items-center gap-1 group-hover:underline"
                >
                  Practice Topic &rarr;
                </a>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {filteredCategories.length === 0 && (
        <div className="text-center py-12 bg-surface border border-dashed border-border rounded-card space-y-3">
          <p className="text-sm font-semibold text-ink">No categories match &quot;{searchTerm}&quot;</p>
          <p className="text-xs text-slate max-w-sm mx-auto">
            Try searching for other clinical terms like &apos;Cardio&apos;, &apos;NICE&apos;, &apos;MEP&apos;, &apos;Diabetes&apos; or reset the filters.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => { setSearchTerm(''); setSelectedWeighting('All'); }}
            className="text-xs mt-2"
          >
            Clear Filters
          </Button>
        </div>
      )}
    </div>
  );
}
