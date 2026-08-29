import { describe, it, expect } from 'vitest';
import { splitIntoChunks, estimateTokens } from './lib/chunking-pipeline';

describe('Chunking Pipeline on Publish (Section 5.1 & Milestone 5)', () => {
  it('estimates tokens accurately for clinical text', () => {
    const text = 'Amlodipine 5 mg once daily is the first-line antihypertensive agent.';
    const tokens = estimateTokens(text);
    expect(tokens).toBeGreaterThan(10);
    expect(tokens).toBeLessThan(30);
  });

  it('splits long markdown document into semantic chunks targeting token threshold', () => {
    const markdownDoc = `
# Hypertension (NICE NG136)

## Overview & Stepped Care
Hypertension is defined as clinic blood pressure >= 140/90 mmHg with ABPM/HBPM >= 135/85 mmHg.
Step 1 treatment depends on age and family origin. For patients aged < 55 years and not of Black African or African-Caribbean origin, start an ACE inhibitor (ACEi) or ARB.

## Stepped Care Protocol Table
| Step | Patient Group | First-Line Therapy |
| :--- | :--- | :--- |
| Step 1 | Under 55, non-Black | ACEi (e.g. Ramipril) or ARB (e.g. Losartan) |
| Step 1 | Over 55 or Black African/Caribbean | CCB (e.g. Amlodipine) |
| Step 2 | Dual Therapy | ACEi/ARB + CCB or Thiazide-like Diuretic |
| Step 3 | Triple Therapy | ACEi/ARB + CCB + Thiazide-like Diuretic |

## Key Clinical Cautions
Do not combine ACE inhibitors with ARBs due to increased risks of hyperkalaemia, hypotension, and renal impairment.
Monitor serum potassium and renal function (eGFR/creatinine) before initiation and 1-2 weeks after starting or dose increases.
    `.trim();

    const chunks = splitIntoChunks(markdownDoc, 200, 30);
    
    expect(chunks.length).toBeGreaterThan(0);
    expect(chunks[0].chunkIndex).toBe(0);
    expect(chunks[0].text).toContain('Hypertension (NICE NG136)');
    expect(chunks[0].tokenCount).toBeGreaterThan(0);
  });

  it('handles empty text gracefully', () => {
    const chunks = splitIntoChunks('');
    expect(chunks).toEqual([]);
  });
});
