// Define constants used in evaluator.ts

export const CLASS_DEFINITIONS = [
  { class: 'A', description: 'Excellent', taRange: [0, 10] },
  { class: 'B', description: 'Good', taRange: [10, 20] },
  { class: 'C', description: 'Average', taRange: [20, 30] },
];

// Ensure FeedbackCategory matches FEEDBACK_THRESHOLDS keys
export type FeedbackCategory = 'perfect' | 'excellent' | 'good' | 'fair' | 'poor';

// Add missing properties to FEEDBACK_THRESHOLDS
export const FEEDBACK_THRESHOLDS = {
  perfect: { range: 5, points: 10, color: 'green', message: 'Perfect!' },
  excellent: { range: 10, points: 8, color: 'blue', message: 'Excellent!' },
  good: { range: 20, points: 6, color: 'yellow', message: 'Good!' },
  fair: { range: 30, points: 4, color: 'orange', message: 'Fair!' },
  poor: { range: 50, points: 2, color: 'red', message: 'Poor!' },
};

export const AGE_BASED_STANDARDS = {
  child: { min: 10, max: 20 },
  teen: { min: 15, max: 25 },
  adult: { min: 20, max: 30 },
  senior: { min: 25, max: 35 },
};