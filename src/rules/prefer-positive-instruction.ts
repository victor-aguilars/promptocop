import type { Rule, RuleResult } from '../types.js';

// Format-specific negative instructions — flagged because positive phrasing is more reliable
const NEGATIVE_FORMAT_PATTERNS: RegExp[] = [
  /\b(don'?t|do not|avoid|never)\s+(use\s+)?markdown\b/i,
  /\bno\s+markdown\b/i,
  /\b(don'?t|do not|avoid|never)\s+(use\s+)?bullet\s+points?\b/i,
  /\bno\s+bullet\s+points?\b/i,
  /\b(don'?t|do not|avoid|never)\s+(use\s+)?numbered\s+lists?\b/i,
  /\bno\s+numbered\s+lists?\b/i,
  /\b(don'?t|do not|avoid|never)\s+(use\s+)?headers?\b/i,
  /\bno\s+headers?\b/i,
  /\b(don'?t|do not|avoid|never)\s+(use\s+)?code\s+blocks?\b/i,
  /\bno\s+code\s+blocks?\b/i,
  /\b(don'?t|do not|avoid|never)\s+(use\s+)?bold\b/i,
  /\b(don'?t|do not|avoid|never)\s+(use\s+)?italics?\b/i,
  /\b(don'?t|do not|avoid|never)\s+(use\s+)?formatting\b/i,
  /\bno\s+formatting\b/i,
];

const preferPositiveInstruction: Rule = {
  name: 'prefer-positive-instruction',
  description: 'Negative format instruction detected — positive phrasing is more reliable',
  severity: 'info',

  check(prompt: string): RuleResult {
    for (const pattern of NEGATIVE_FORMAT_PATTERNS) {
      const match = pattern.exec(prompt);
      if (match) {
        return {
          passed: false,
          message: 'Negative format instruction — rephrase as a positive instruction for better results',
          matched: match[0],
        };
      }
    }
    return { passed: true };
  },

  directive(): string {
    return "Suggest to the user that negative format instructions (e.g. \"don't use markdown\") work more reliably when rephrased positively (e.g. \"respond in plain prose paragraphs\").";
  },

  explain(): string {
    return `prefer-positive-instruction

Negative format instructions like "don't use markdown" are less reliable
than positive equivalents. Claude responds better to being told what to do
than what to avoid.

Bad:  "don't use markdown"
Bad:  "no bullet points"
Bad:  "avoid headers"
Good: "respond in plain prose paragraphs"
Good: "format your response as flowing prose"
Good: "use plain text"

Triggered by: don't/no/avoid/never + markdown / bullet points / headers /
              numbered lists / code blocks / bold / italics / formatting`;
  },
};

export default preferPositiveInstruction;
