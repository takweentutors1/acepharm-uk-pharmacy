import { Hono } from 'hono';
import { drizzle } from 'drizzle-orm/d1';
import { eq, desc } from 'drizzle-orm';
import { blogPosts, users } from '../db/schema';
import { requireAuth } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';
import type { AuthContext } from '../middleware/auth';

export const blogRoutes = new Hono<AuthContext>();

// Seed default articles if empty
const DEFAULT_POSTS = [
  {
    id: 'post-calc-01',
    slug: 'gphc-calculations-essential-methods',
    title: 'GPhC Calculations: 10 High-Yield Pitfalls, Infusion Formulas, and Paediatric Dosing',
    summary: 'The definitive Paper 1 blueprint: displacement volumes, paediatric mg/kg body weight scaling, infusion rate conversions, and molecular weight shifts.',
    contentMarkdown: `## 1. Deconstructing GPhC Paper 1

Paper 1 tests clinical numeracy, diagnostic precision, and patient safety under rigorous time constraints. Unlike undergraduate university examinations where partial credit is awarded for working methods, the GPhC registration assessment is binary: **a correct numeric answer receives 1 mark; any transcription error, incorrect rounding, or missed unit conversion receives 0 marks**.

The examination comprises 40 calculation questions across 120 minutes (3 minutes per question). To pass, candidates must achieve the minimum passing standard (historically ~70-75%) with zero access to the BNF during Paper 1.

---

## 2. Displacement Volumes in Dry Powder Reconstitution

Displacement volume is the physical volume in millilitres occupied by the solid solute or lyophilised powder when dissolved in a solvent.

\`\`\`
Total Final Volume = Volume of Diluent Added + Displacement Volume
\`\`\`

### Step-by-Step Clinical Scenario:
A community pharmacist receives a prescription for **Amoxicillin 250 mg/5 mL oral suspension**, 100 mL bottle for a paediatric patient.
- The BNF states that the displacement volume for this dry powder is **0.8 mL per 1000 mg** of amoxicillin.
- The total bottle contains **5.0 g of dry amoxicillin powder**.
- How much Water for Injections (diluent) must the pharmacist add to reconstitute the suspension to an exact final volume of 100 mL?

### Calculation Method:
1. **Identify the total displacement volume of the dry powder:**
   - \`Displacement Volume = (5000 mg / 1000 mg) * 0.8 mL = 4.0 mL\`
2. **Calculate diluent volume to add:**
   - \`Diluent Volume = 100 mL - 4.0 mL = 96.0 mL\`
3. **Common Trap:** Subtracting the displacement volume of a single 5 mL dose rather than calculating the displacement of the total bottle contents.

---

## 3. Body Weight Scaling, Ideal Body Weight (IBW), and Paediatric Surface Area

Prescribing in paediatric and bariatric populations requires strict differentiation between **Actual Body Weight (ABW)**, **Ideal Body Weight (IBW)**, and **Adjusted Body Weight (AdjBW)**.

### The Devine Formula for Ideal Body Weight (UK Standard):
- **Men:** \`IBW (kg) = 50 + [2.3 * (Height in inches - 60)]\`
- **Women:** \`IBW (kg) = 45.5 + [2.3 * (Height in inches - 60)]\`

### Paediatric Body Surface Area (Mosteller Formula):
\`\`\`
BSA (m^2) = SQRT([Height (cm) * Weight (kg)] / 3600)
\`\`\`

### High-Yield Rule for Aminoglycosides and Glycopeptides:
When dosing **Gentamicin** or **Vancomycin** in obese patients (where \`ABW > 1.20 * IBW\`):
\`\`\`
Adjusted Dosing Weight = IBW + 0.4 * (ABW - IBW)
\`\`\`
*Using Actual Body Weight in patients with severe obesity results in nephrotoxic and ototoxic serum trough levels.*

---

## 4. Rate of Infusion Conversions (mL/hr to Drops/min)

Infusion questions test the candidate's ability to navigate gravity-fed IV giving sets versus electronic volumetric pumps.

### Key Conversion Identities:
- **Standard IV Giving Set (Crystalloids/Fluids):** 20 drops per mL (20 gtt/mL)
- **Blood Giving Set:** 15 drops per mL (15 gtt/mL)
- **Paediatric Microbore/Burette Set:** 60 drops per mL (60 gtt/mL)

### Universal Formula:
\`\`\`
Drip Rate (drops/min) = [Total Volume to Infuse (mL) * Drop Factor (drops/mL)] / Total Time (minutes)
\`\`\`

*Clinical Shortcut:* When drop factor is 20: \`Drip rate (drops/min) = [Infusion Rate in mL/hr] / 3\`.

---

## 5. Electrolyte Concentrations, Millimoles, and Molecular Weight Shifts

Many GPhC calculations present a prescription in millimoles (mmol) while the available ampoules are labelled in percentage weight-in-volume (% w/v) or milligrams per millilitre (mg/mL).

### Formula:
\`\`\`
Mass (mg) = Number of mmols * Molecular Weight (g/mol)
\`\`\`

### Monovalent vs Divalent Ions:
- For monovalent ions (Na+, K+, Cl-): \`1 mmol = 1 mEq\`
- For divalent ions (Ca2+, Mg2+, SO4 2-): \`1 mmol = 2 mEq\`

Always check whether the drug is prescribed as the anhydrous active base or the hydrated salt (e.g. Morphine sulfate pentahydrate vs Morphine base).

---

## 6. The 5 Golden Rules for 100% Precision in Paper 1

1. **Write Units at Every Intermediate Step:** Prevent catastrophic factor-of-1000 errors.
2. **Never Round Intermediate Steps:** Maintain full calculator memory precision until the final line.
3. **Check Practical Real-World Plausibility:** A calculated dose of 45 tablets or an IV infusion running at 8 litres per hour must instantly trigger a recalculation.
4. **Time Boxing:** Never spend more than 3 minutes on a single question on your first pass. Flag difficult multi-step pharmacokinetics questions and return during the final buffer.
5. **Practice with an On-Screen Interface:** Practising within the AcePharm timed examination environment replicates the actual test-day interface.`,
    coverImageUrl: 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?auto=format&fit=crop&q=80&w=1000',
    published: true,
    publishedAt: new Date('2026-09-18T09:00:00Z'),
    readingTimeMinutes: 12,
    tagsJson: JSON.stringify(['Calculations', 'GPhC Paper 1', 'Paediatrics', 'BNF']),
  },
  {
    id: 'post-asthma-01',
    slug: 'asthma-bts-sign-vs-nice-guideline-comparison',
    title: 'NICE CKS vs BNF 87/88: Mastering the High-Weighting Therapeutic Clinical Scenarios',
    summary: 'Step-by-step decision algorithms for Hypertension (NG136), Asthma (BTS/SIGN vs NICE NG80), and Type 2 Diabetes (NG28) for GPhC Paper 2.',
    contentMarkdown: `## 1. The Clinical Hierarchy in GPhC Paper 2

In Paper 2 single best answer (SBA) questions, all 5 options are frequently plausible clinical interventions. However, the correct answer is the **first-line evidence-based recommendation according to UK national guidance (NICE CKS and BNF)**.

The GPhC Registration Assessment Paper 2 heavily prioritises high-weighting clinical areas defined in the GPhC syllabus: **Cardiovascular, Central Nervous System (CNS), Endocrine, Infections, and Respiratory**.

---

## 2. Cardiovascular: Hypertension (NICE Guideline NG136)

### Diagnostic Thresholds:
- **Clinic Blood Pressure >= 140/90 mmHg** + **ABPM/HBPM daytime average >= 135/85 mmHg** defines Stage 1 Hypertension.
- **Clinic Blood Pressure >= 160/100 mmHg** + **ABPM/HBPM >= 150/95 mmHg** defines Stage 2 Hypertension.

### Pharmacological Treatment Algorithm:
1. **Type 2 Diabetes (any age/ethnicity) OR Non-black patient aged < 55:**
   - **Step 1:** ACE Inhibitor (e.g. Ramipril) OR ARB (e.g. Losartan).
   - **Step 2 (if uncontrolled):** Dual Therapy: (ACEi / ARB) + CCB (e.g. Amlodipine) OR Thiazide-like Diuretic (e.g. Indapamide).
   - **Step 3:** Triple Therapy: (ACEi / ARB) + CCB + Thiazide-like Diuretic.
   - **Step 4 (Resistant):** If K+ <= 4.5 mmol/L add low-dose Spironolactone; if K+ > 4.5 mmol/L add Alpha-blocker or Beta-blocker.
2. **Black African/African-Caribbean origin OR Age >= 55 without Type 2 Diabetes:**
   - **Step 1:** Calcium Channel Blocker (CCB - e.g. Amlodipine). (If not tolerated: Thiazide-like Diuretic).
   - **Step 2:** CCB + (ACEi / ARB / Thiazide-like Diuretic).

---

## 3. Respiratory: Asthma Inhaler Stepping (NICE NG80 vs BTS/SIGN 158)

| Parameter | BTS / SIGN Guideline | NICE NG80 Guideline |
| :--- | :--- | :--- |
| **Step 1 (Mild/Infrequent)** | SABA as required (e.g. Salbutamol 100 mcg) | SABA as required |
| **Step 2 (Regular Preventer)** | Low-dose Inhaled Corticosteroid (ICS) | Low-dose ICS |
| **Step 3 (First Add-on)** | Add **LABA** to Low-dose ICS | Add **LTRA** (e.g. Montelukast 10 mg) |
| **Step 4 (Escalation)** | Switch to **MART** OR increase ICS | Add **LABA** (with or without LTRA) |
| **MART Counselling** | Patient stops separate SABA; combination inhaler acts as preventer and reliever. |

---

## 4. Endocrine: Type 2 Diabetes Glycaemic Management (NICE NG28)

### Target HbA1c Levels:
- **48 mmol/mol (6.5%):** Managed by lifestyle alone, or single drug not associated with hypoglycaemia (Metformin).
- **53 mmol/mol (7.0%):** Managed by a drug associated with hypoglycaemia (Sulfonylurea, Meglitinide, Insulin).

### Cardiovascular Disease (CVD) Stratification:
- If the patient has **established atherosclerotic cardiovascular disease (CVD)** or **chronic heart failure**:
  \`First-line Therapy = Metformin + SGLT2 Inhibitor (e.g. Empagliflozin / Dapagliflozin)\`
- *Safety check:* Assess eGFR before initiating SGLT2i and counsel on signs of euglycaemic Diabetic Ketoacidosis (DKA) and genital mycotic infections.

---

## 5. Summary Checklists for Examination Day

1. **Check Renal Function First:** In any clinical vignette, check Serum Creatinine, eGFR, or CrCl using the Cockcroft-Gault equation.
2. **Review Interactions with OTC/Herbal Preparations:** Look for St John's Wort (CYP3A4 inducer), NSAIDs (triple whammy with ACEi + Diuretics), and Oral Decongestants.
3. **Verify Prescription Legality:** Always ensure dose, form, strength, and directions comply with the latest MEP standards.`,
    coverImageUrl: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&q=80&w=1000',
    published: true,
    publishedAt: new Date('2026-09-12T09:00:00Z'),
    readingTimeMinutes: 11,
    tagsJson: JSON.stringify(['Clinical Revision', 'NICE CKS', 'BNF', 'Cardiovascular', 'Respiratory']),
  },
  {
    id: 'post-high-risk-01',
    slug: 'high-risk-medicines-monitoring-guidelines',
    title: 'High-Risk Medicines in UK Pharmacy: Monitoring, Toxicities, and MHRA Alerts',
    summary: 'Complete clinical safety guide for Lithium, Methotrexate, Amiodarone, Digoxin, and Gentamicin. Target serum ranges, sampling times, and red flags.',
    contentMarkdown: `## 1. High-Risk Drug Safety Matrix

High-risk medicines represent over 30% of clinical safety questions in the GPhC registration examination. Pharmacists must master therapeutic target ranges, sample timing post-dose, baseline safety checks, and critical MHRA safety alerts.

| Medicine | Target Serum Therapeutic Level | Sample Timing Post-Dose | Critical Baseline & Routine Tests | Major Toxicity Symptoms |
| :--- | :--- | :--- | :--- | :--- |
| **Lithium** | **0.4 - 1.0 mmol/L** (0.8-1.0 for acute mania/relapse) | **12 hours post-dose** | Renal function (eGFR), Thyroid function (TFTs), Calcium, Weight. | Coarse tremor, ataxia, dysarthria, hyperreflexia, confusion. |
| **Digoxin** | **0.8 - 2.0 mcg/L** (1.0-2.6 nmol/L) | **At least 6 hours post-dose** | Serum potassium (hypokalaemia potentiation), renal function. | Nausea, vomiting, yellow-green visual halos (xanthopsia), heart block. |
| **Theophylline** | **10 - 20 mg/L** (55 - 110 micromol/L) | **4 to 6 hours post oral dose** | Hepatic enzymes, plasma potassium. | Tachycardia, arrhythmias, convulsions, severe vomiting. |
| **Gentamicin** | **Trough:** < 1.0 mg/L (< 2.0 for endocarditis) | **Immediately prior to next dose** | Serum creatinine, audiometry. | Ototoxicity (irreversible), nephrotoxicity (reversible). |
| **Methotrexate** | Standard oncology/rheumatology dosing | Weekly until stable, then monthly | FBC, LFTs, U&Es, Chest X-ray. | Sore throat/fever (bone marrow suppression), dry cough (pulmonary fibrosis). |

---

## 2. Lithium Carbonate & Citrate: Essential Safety Protocols

Lithium has an extremely narrow therapeutic index. Toxicity can be precipitated by dehydration, sodium restriction, and interacting medications that decrease renal lithium clearance.

### The "Triple Threat" Drug Interactions that Elevate Serum Lithium:
1. **NSAIDs (e.g. Ibuprofen, Naproxen):** Inhibit renal prostaglandin synthesis, reducing renal blood flow and increasing lithium reabsorption.
2. **ACE Inhibitors / ARBs (e.g. Ramipril, Candesartan):** Reduce glomerular filtration rate and promote sodium/lithium retention.
3. **Thiazide & Loop Diuretics (e.g. Bendroflumethiazide, Furosemide):** Induce natriuresis, triggering compensatory proximal tubular reabsorption of lithium ions.

### Mandatory Patient Counselling Checklist:
- Maintain consistent fluid intake (1.5 - 2.0 L/day) and avoid sudden dietary salt reduction.
- Provide the official **Lithium Treatment Pack** (purple patient information booklet, record card, and alert card).
- Brand-specific prescribing: Lithium preparations (Priadel, Camcolit, Liskonum) possess differing bioavailability; never switch brands without specialist supervision.

---

## 3. Oral Methotrexate: Preventing Once-Weekly Overdose Fatalities

Oral methotrexate for rheumatoid arthritis, psoriasis, and Crohn's disease must be taken **ONCE WEEKLY on the same designated day**. Accidental daily dosing can be fatal due to acute myelosuppression.

### Statutory Safety Requirements:
- **Specific Day of the Week:** The prescription and dispensing label must state the exact day of the week (e.g. *"Take 15 mg once weekly on MONDAYS"*), never *"as directed"*.
- **Only 2.5 mg Tablets Dispensed:** To avoid confusion between 2.5 mg and 10 mg strengths, UK community pharmacies standardise on 2.5 mg tablets wherever possible.
- **Folic Acid Co-prescription:** Prescribed (e.g. 5 mg once weekly, taken 24 to 48 hours after methotrexate) to minimise gastrointestinal and haematological side effects.

---

## 4. Amiodarone Hydrochloride: Multi-Organ Monitoring Requirements

Amiodarone contains iodine and has an exceptionally long terminal half-life (up to 50 days), causing cumulative tissue deposits across multiple organ systems.

### Monitoring Schedule:
- **Baseline Tests:** Thyroid Function Tests (TFTs), Liver Function Tests (LFTs), Serum Potassium, Baseline Chest X-ray, ECG (QTc interval).
- **Every 6 Months:** TFTs, LFTs.
- **Clinical Toxicity Red Flags:**
  - *Pulmonary Toxicity:* Progressive shortness of breath, dry cough, or unexplained fever.
  - *Ocular Toxicity:* Optic neuropathy/neuritis with blurred vision (requires urgent ophthalmology assessment).
  - *Dermatological:* Slate-grey skin discolouration and severe photosensitivity (advise SPF 50+ UVA/UVB protection).`,
    coverImageUrl: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&q=80&w=1000',
    published: true,
    publishedAt: new Date('2026-08-28T09:00:00Z'),
    readingTimeMinutes: 10,
    tagsJson: JSON.stringify(['Registration Assessment', 'High-Risk Drugs', 'MHRA', 'BNF']),
  },
  {
    id: 'post-comparison-01',
    slug: 'passmed-vs-quesmed-vs-acepharm-uk-pharmacy-comparison',
    title: 'Passmed vs Quesmed vs AcePharm: Choosing the Best UK Revision Platform (2026)',
    summary: 'A deep comparative review of UK healthcare question banks: why medical question banks fall short for pharmacy students and how AcePharm fills the gap.',
    contentMarkdown: `## 1. Feature & Capability Comparison Matrix

While legacy platforms like **Passmedicine** and **Quesmed** were originally designed for UK medical undergraduate and MSRA candidates, **AcePharm** is purpose-built exclusively for UK MPharm students, foundation trainees, and GPhC registration assessment candidates.

| Feature / Criteria | Passmedicine (Passmed) | Quesmed | AcePharm |
| :--- | :--- | :--- | :--- |
| **Primary Target Audience** | UK Medical (MBChB / MSRA / MRCP) | Medical Students & Junior Doctors | **UK MPharm Students, Foundation Trainees & GPhC Candidates** |
| **GPhC Paper 1 Calculation Engine** | Limited / Basic Math | Basic Numeracy | **Interactive Step-by-Step Calculation Coach with Unit Checks** |
| **Clinical Guideline Grounding** | General UK Medical / NICE | Medical Specialties | **Exclusively BNF 87/88, BNFc, NICE CKS, MHRA & MEP 47** |
| **Spaced Repetition Algorithm** | Standard Knowledge Bank | Flashcard System | **Native SM-2 Spaced Repetition with Confidence Calibration** |
| **Real-time AI Clinical Tutor** | None | Limited AI Chat | **Ace AI: Interactive Socratic Clinical Case Simulator** |
| **Free Access Tier** | Trial Period | Limited Free Access | **Explorer Tier: 30 Free Questions/Month with Full Explanations** |
| **Mobile & Performance** | Standard Web View | Dedicated App | **Sub-second Edge-Rendered Web App (WCAG 2.2 AA Compliant)** |

---

## 2. Why Medical Question Banks Fall Short for Pharmacy Candidates

Historically, UK pharmacy students resorted to using medical question banks because dedicated pharmacy resources were scarce. However, significant pedagogical differences exist:

1. **Calculations Rigour:** Medical exams feature minimal calculations. The GPhC Paper 1 contains 40 highly complex, multi-stage pharmaceutical numeracy questions requiring exact diagnostic precision.
2. **Dispensing & Prescription Legality:** The GPhC assessment tests the legal validity of Controlled Drug prescriptions, instalment dispensing rules, veterinary prescriptions, and emergency supplies under MEP 47—topics completely omitted in medical banks.
3. **High-Risk Therapeutic Drug Monitoring:** Pharmacists are expected to know exact serum sampling timings (e.g. 12 hours post-lithium dose, 6 hours post-digoxin dose) and therapeutic target values down to exact decimal ranges.

---

## 3. How AcePharm Solves the "Illusion of Competence"

Many candidates complete thousands of revision questions and achieve 80%+ scores, only to struggle in the actual GPhC exam. This occurs because repeating identical questions creates **recognition memory** rather than **generative retrieval**.

AcePharm eliminates this blind spot through **Confidence-Calibrated Scoring**:
- Before submitting an answer, you record your subjective confidence level (*Low, Medium, High*).
- If you answer correctly with *Low Confidence*, the system flags this as "Lucky Guess" and schedules a review via the SM-2 algorithm.
- If you answer incorrectly with *High Confidence*, the platform categorises this as an **"Uncalibrated Knowledge Hazard"**, directing you to the underlying BNF clinical monograph.

---

## 4. Final Verdict: Which Platform Should You Choose?

- **Choose Passmed/Quesmed if:** You are a medical student or junior doctor preparing for the UKMLA, MSRA, or MRCP examinations.
- **Choose AcePharm if:** You are an MPharm student (Years 2-4), an Oriel applicant, a Foundation Trainee Pharmacist, or an OSPAP candidate targeting first-time success in the GPhC Registration Assessment.`,
    coverImageUrl: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&q=80&w=1000',
    published: true,
    publishedAt: new Date('2026-09-01T09:00:00Z'),
    readingTimeMinutes: 9,
    tagsJson: JSON.stringify(['MPharm Study', 'Platform Comparison', 'GPhC Revision', 'Passmed Alternative']),
  },
  {
    id: 'post-oriel-01',
    slug: 'oriel-pharmacy-sjt-foundation-training-guide',
    title: 'Oriel Pharmacy Recruitment: Master the Situational Judgement Test (SJT) and Foundation Posts',
    summary: 'A step-by-step masterclass on scoring in the top decile for Oriel pharmacy SJT, ranking NHS and community placements, and handling ethical dilemmas.',
    contentMarkdown: `## 1. The Structure of the Oriel Recruitment Assessment

The national Oriel recruitment process determines the allocation of UK Foundation Training Pharmacist posts across NHS hospital trusts, community pharmacy multiples, independent contractors, and integrated GP practices. The recruitment score is determined by the **Situational Judgement Test (SJT)** and **Numeracy Assessment**.

The assessment comprises two core components:
1. **Situational Judgement Test (SJT):** Evaluates professional attributes, ethics, communication, teamwork, and decision-making aligned with the GPhC Standards for Pharmacy Professionals.
2. **Numeracy Assessment:** Tests rapid pharmaceutical mathematics, dilution calculations, and unit conversions under strict time constraints.

---

## 2. Deconstructing the Situational Judgement Test (SJT)

SJT questions present realistic workplace scenarios encountered during foundation training and require candidates to either:
- **Rank 5 actions from Most Appropriate to Least Appropriate (Ranking Questions)**, or
- **Select the 3 Most Appropriate Actions to take together from 8 options (Multiple Choice Questions)**.

### The 4 Pillars of SJT Decision Making:
1. **Patient Safety First:** Immediate harm prevention, medication quarantine, and clinical escalation.
2. **Professional Accountability:** Open duty of candour, admitting errors, and logging incidents for systemic improvement.
3. **Effective Communication:** Active listening, empathy, de-escalation, and interprofessional respect.
4. **Teamwork & Escalation:** Supporting colleagues without compromising clinical standards.

---

## 3. High-Yield SJT Practice Scenario: Prescription Dispensing Error

### Scenario:
You are a trainee pharmacist in a busy community pharmacy. While handing over a prescription for **Gliclazide 80 mg tablets** to an elderly patient, you notice the dispensary assistant has accidentally dispensed and labelled **Glimepiride 4 mg tablets**. The patient has not yet left the pharmacy counter.

### Actions to Rank (from 1 = Most Appropriate to 5 = Least Appropriate):
- **Action A:** Politely inform the patient there is a slight delay, retain the bag, explain the error with empathy, rectify the medication immediately, and record the near miss on the pharmacy's incident reporting system.
- **Action B:** Discreetly take the dispensary assistant aside, reprimand them in private for making a dangerous error, and demand they re-dispense the prescription.
- **Action C:** Hand the medication to the patient as dispensed, but advise them verbally to only take half a tablet until you can contact the prescriber.
- **Action D:** Retain the medication, rectify the supply immediately, but do not mention the error to the patient or log it to avoid causing unnecessary anxiety.
- **Action E:** Immediately shout across the dispensary to alert the Responsible Pharmacist that a serious mistake was made.

### Correct Ranking & Clinical Rationale:
\`\`\`
A > D > B > E > C
\`\`\`

1. **Action A (Rank 1 - Best):** Directly addresses patient safety, practices open duty of candour, corrects the dispensing error before consumption, and logs the incident for systematic learning.
2. **Action D (Rank 2):** Prevents physical patient harm by rectifying the medication, but lacks transparency and fails organizational near-miss reporting standards.
3. **Action B (Rank 3):** Addresses the issue within the team, but delays resolution for the patient and adopts an unconstructive, punitive blame culture.
4. **Action E (Rank 4):** Ensures the pharmacist is aware, but causes panic, compromises confidentiality, and breaches professional conduct standards.
5. **Action C (Rank 5 - Worst):** Directly endangers patient safety by releasing a potent sulfonylurea with incorrect instructions, creating an acute risk of severe hypoglycaemia.

---

## 4. Oriel Numeracy: Core High-Speed Strategies

Unlike the 3-minute-per-question allowance in GPhC Paper 1, the Oriel numeracy assessment is a rapid filter test.

- **Master Mental Math Shortcuts:** Learn quick percentage conversions (1 in 10,000 = 0.01% = 10 mg in 100 mL = 100 mcg/mL).
- **Check Significant Figures:** Answer options frequently differ only by decimal place placement.
- **Stay Calm Under Time Pressure:** If a calculation involves more than 4 conversion steps, pick your best estimate, flag it, and move forward immediately.

---

## 5. Summary: 5 Steps to Securing Your Top Preference Post

1. **Align Your Answers with GPhC Standards:** Whenever an ethical dilemma arises, choose the option that puts patient safety and transparency first.
2. **Never Shift Blame:** The GPhC values professional accountability over deflection.
3. **Understand the Foundation Training Curriculum:** Familiarise yourself with the 13 GPhC Foundation Training learning outcomes before your preference interviews.
4. **Practice with Real-Time Feedback:** Use AcePharm's interactive SJT simulation modules to calibrate your decision-making against UK clinical scoring matrices.`,
    coverImageUrl: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&q=80&w=1000',
    published: true,
    publishedAt: new Date('2026-08-20T09:00:00Z'),
    readingTimeMinutes: 10,
    tagsJson: JSON.stringify(['Registration Assessment', 'Oriel SJT', 'Foundation Training', 'Ethics']),
  },
];

// 1. Public: List all published posts
blogRoutes.get('/', async (c) => {
  const db = drizzle(c.env.DB);
  
  let posts = await db
    .select()
    .from(blogPosts)
    .where(eq(blogPosts.published, true))
    .orderBy(desc(blogPosts.publishedAt));

  if (posts.length === 0) {
    // Seed default posts on first run
    for (const post of DEFAULT_POSTS) {
      await db.insert(blogPosts).values({
        ...post,
        createdAt: new Date(),
        updatedAt: new Date(),
      }).onConflictDoNothing();
    }
    posts = await db
      .select()
      .from(blogPosts)
      .where(eq(blogPosts.published, true))
      .orderBy(desc(blogPosts.publishedAt));
  }

  return c.json({ posts });
});

// 2. Public: Get published post by slug
blogRoutes.get('/:slug', async (c) => {
  const slug = c.req.param('slug');
  const db = drizzle(c.env.DB);

  let [post] = await db
    .select()
    .from(blogPosts)
    .where(eq(blogPosts.slug, slug))
    .limit(1);

  if (!post) {
    // Check default posts
    const match = DEFAULT_POSTS.find((p) => p.slug === slug);
    if (match) {
      await db.insert(blogPosts).values({
        ...match,
        createdAt: new Date(),
        updatedAt: new Date(),
      }).onConflictDoNothing();

      [post] = await db
        .select()
        .from(blogPosts)
        .where(eq(blogPosts.slug, slug))
        .limit(1);
    }
  }

  if (!post || (!post.published && c.get('user')?.role === 'super_admin')) {
    return c.json({ error: 'Blog post not found' }, 404);
  }

  return c.json({ post });
});

// 3. Admin: List all posts (draft & published)
blogRoutes.get('/admin/all', requireAuth, requireRole(['marketing_editor', 'super_admin']), async (c) => {
  const db = drizzle(c.env.DB);
  const posts = await db.select().from(blogPosts).orderBy(desc(blogPosts.createdAt));
  return c.json({ posts });
});

// 4. Admin: Create or update blog post
blogRoutes.post('/admin/save', requireAuth, requireRole(['marketing_editor', 'super_admin']), async (c) => {
  const db = drizzle(c.env.DB);
  const user = c.get('user');
  const body = await c.req.json<{
    id?: string;
    slug: string;
    title: string;
    summary: string;
    contentMarkdown: string;
    coverImageUrl?: string;
    published?: boolean;
    readingTimeMinutes?: number;
    tagsJson?: string;
  }>();

  if (!body.slug || !body.title || !body.contentMarkdown) {
    return c.json({ error: 'Validation: slug, title, and contentMarkdown are required' }, 400);
  }

  const postId = body.id || `post-${crypto.randomUUID()}`;
  const now = new Date();

  await db
    .insert(blogPosts)
    .values({
      id: postId,
      slug: body.slug,
      title: body.title,
      summary: body.summary || '',
      contentMarkdown: body.contentMarkdown,
      coverImageUrl: body.coverImageUrl || null,
      authorId: user.id,
      published: Boolean(body.published),
      publishedAt: body.published ? now : null,
      readingTimeMinutes: body.readingTimeMinutes || 4,
      tagsJson: body.tagsJson || '[]',
      createdAt: now,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: blogPosts.id,
      set: {
        slug: body.slug,
        title: body.title,
        summary: body.summary || '',
        contentMarkdown: body.contentMarkdown,
        coverImageUrl: body.coverImageUrl || null,
        published: Boolean(body.published),
        publishedAt: body.published ? now : null,
        readingTimeMinutes: body.readingTimeMinutes || 4,
        tagsJson: body.tagsJson || '[]',
        updatedAt: now,
      },
    });

  return c.json({ success: true, id: postId, slug: body.slug });
});
