import { SEED_CURRICULUM_DATA, generateSeedQuestions } from './src/seed-questions';

export function generateSeedSQL() {
  const statements = [];
  const now = Math.floor(Date.now() / 1000);

  // 1. Curriculum
  for (const item of SEED_CURRICULUM_DATA) {
    statements.push(`INSERT OR IGNORE INTO pathways (id, name, code, sort_order, active, created_at, updated_at) VALUES ('${item.pathway.id}', '${item.pathway.name.replace(/'/g, "''")}', '${item.pathway.code}', ${item.pathway.sortOrder}, 1, ${now}, ${now});`);

    for (const cat of item.categories) {
      statements.push(`INSERT OR IGNORE INTO categories (id, pathway_id, name, code, sort_order, active, created_at, updated_at) VALUES ('${cat.id}', '${item.pathway.id}', '${cat.name.replace(/'/g, "''")}', '${cat.code}', ${cat.sortOrder}, 1, ${now}, ${now});`);

      for (const sub of cat.subtopics) {
        statements.push(`INSERT OR IGNORE INTO subtopics (id, category_id, name, code, sort_order, active, created_at, updated_at) VALUES ('${sub.id}', '${cat.id}', '${sub.name.replace(/'/g, "''")}', '${sub.code}', ${sub.sortOrder}, 1, ${now}, ${now});`);
      }
    }
  }

  // 2. 135 Seed Questions (Processed and published one at a time)
  const questionsList = generateSeedQuestions(135);
  for (const q of questionsList) {
    const qId = crypto.randomUUID();
    
    // Base Question
    statements.push(`INSERT INTO questions (id, public_id, version, status, pathway_id, primary_subtopic_id, difficulty, question_type, sector, origin, published_at, created_at, updated_at) VALUES ('${qId}', '${q.publicId}', 1, 'published', '${q.pathwayId}', '${q.primarySubtopicId}', '${q.difficulty}', '${q.questionType}', '${q.sector}', 'human', ${now}, ${now}, ${now});`);

    // Content
    const numAns = q.calculation?.numericAnswer ? `'${q.calculation.numericAnswer}'` : 'NULL';
    const numTol = q.calculation?.numericTolerance ? `'${q.calculation.numericTolerance}'` : 'NULL';
    const numUnit = q.calculation?.numericUnit ? `'${q.calculation.numericUnit}'` : 'NULL';
    const calcWork = q.calculation?.calculationWorking ? `'${q.calculation.calculationWorking.replace(/'/g, "''")}'` : 'NULL';
    
    statements.push(`INSERT INTO question_content (id, question_id, stem, lead_in, numeric_answer, numeric_tolerance, numeric_unit, decimal_places, calculator_allowed, calculation_working, created_at, updated_at) VALUES ('${crypto.randomUUID()}', '${qId}', '${q.stem.replace(/'/g, "''")}', '${q.leadIn.replace(/'/g, "''")}', ${numAns}, ${numTol}, ${numUnit}, ${q.calculation?.decimalPlaces ?? 'NULL'}, 1, ${calcWork}, ${now}, ${now});`);

    // Options
    for (let i = 0; i < q.options.length; i++) {
      const opt = q.options[i];
      statements.push(`INSERT INTO question_options (id, question_id, label, content, is_correct, rationale, sort_order, created_at) VALUES ('${crypto.randomUUID()}', '${qId}', '${opt.label}', '${opt.content.replace(/'/g, "''")}', ${opt.isCorrect ? 1 : 0}, '${opt.rationale.replace(/'/g, "''")}', ${i}, ${now});`);
    }

    // Explanation
    statements.push(`INSERT INTO question_explanations (id, question_id, summary_takeaway, detailed_explanation, clinical_guidance_reference, created_at, updated_at) VALUES ('${crypto.randomUUID()}', '${qId}', '${q.explanation.summaryTakeaway.replace(/'/g, "''")}', '${q.explanation.detailedExplanation.replace(/'/g, "''")}', '${q.explanation.clinicalGuidanceReference.replace(/'/g, "''")}', ${now}, ${now});`);

    // Governance Record
    statements.push(`INSERT INTO question_governance (id, question_id, clinical_approved_at, educational_approved_at, copy_editor_approved_at, approved_at, conflict_of_interest, created_at, updated_at) VALUES ('${crypto.randomUUID()}', '${qId}', ${now}, ${now}, ${now}, ${now}, 0, ${now}, ${now});`);
  }

  return statements.join('\n');
}

import * as fs from 'fs';
const sql = generateSeedSQL();
fs.writeFileSync('./seed_135.sql', sql);
console.log('Wrote seed_135.sql successfully.');
