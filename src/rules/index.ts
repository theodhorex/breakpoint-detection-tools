import { PageSnapshot, AlignedElement, InconsistencyIssue } from '../types.js';
import { evaluateOverflowRules } from './overflow.js';
import { evaluateTypographyRules } from './typography.js';
import { evaluateSpacingRules } from './spacing.js';

export function runDetectionRules(
  pageSnapshots: PageSnapshot[],
  alignedElements: AlignedElement[]
): InconsistencyIssue[] {
  const issues: InconsistencyIssue[] = [];

  // Run each rule evaluator
  issues.push(...evaluateOverflowRules(pageSnapshots, alignedElements));
  issues.push(...evaluateTypographyRules(pageSnapshots, alignedElements));
  issues.push(...evaluateSpacingRules(pageSnapshots, alignedElements));

  // Sort issues by severity: CRITICAL first, then HIGH, MEDIUM, LOW
  const severityOrder: Record<string, number> = {
    CRITICAL: 0,
    HIGH: 1,
    MEDIUM: 2,
    LOW: 3,
  };

  issues.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

  return issues;
}
