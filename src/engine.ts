import { chromium } from 'playwright';
import { Breakpoint, PageSnapshot, AuditReport, IssueCategory, IssueSeverity } from './types.js';
import { extractPageSnapshot } from './extractor.js';
import { alignElementsAcrossBreakpoints } from './matcher.js';
import { runDetectionRules } from './rules/index.js';

export interface AuditOptions {
  breakpoints?: Breakpoint[];
}

export const DEFAULT_BREAKPOINTS: Breakpoint[] = [320, 768, 1024, 1440];

/**
 * Runs an automated multi-breakpoint responsive design audit on a given target URL.
 */
export async function runResponsiveAudit(
  targetUrl: string,
  options: AuditOptions = {}
): Promise<AuditReport> {
  const breakpoints = options.breakpoints || DEFAULT_BREAKPOINTS;
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  const pageSnapshots: PageSnapshot[] = [];

  try {
    for (const bp of breakpoints) {
      // Set viewport to target breakpoint width
      await page.setViewportSize({ width: bp, height: 900 });

      // Navigate to target URL and wait for DOM readiness
      await page.goto(targetUrl, { waitUntil: 'load', timeout: 30000 });

      // Small delay for layout recalculation and font settling
      await page.waitForTimeout(300);

      // Extract DOM and computed styles for this breakpoint
      const snapshot = await extractPageSnapshot(page, bp);
      pageSnapshots.push(snapshot);
    }
  } finally {
    await browser.close();
  }

  // Align elements across all captured breakpoints
  const alignedElements = alignElementsAcrossBreakpoints(pageSnapshots, breakpoints);

  // Evaluate rule-based detectors
  const issues = runDetectionRules(pageSnapshots, alignedElements);

  // Calculate statistics
  const issuesByCategory: Record<IssueCategory, number> = {
    OVERFLOW: 0,
    TYPOGRAPHY: 0,
    SPACING: 0,
  };

  const issuesBySeverity: Record<IssueSeverity, number> = {
    CRITICAL: 0,
    HIGH: 0,
    MEDIUM: 0,
    LOW: 0,
  };

  issues.forEach((issue) => {
    issuesByCategory[issue.category] = (issuesByCategory[issue.category] || 0) + 1;
    issuesBySeverity[issue.severity] = (issuesBySeverity[issue.severity] || 0) + 1;
  });

  const pageSnapshotMap: Record<number, any> = {};
  pageSnapshots.forEach((s) => {
    pageSnapshotMap[s.breakpoint] = {
      documentScrollWidth: s.documentScrollWidth,
      windowInnerWidth: s.windowInnerWidth,
      hasOverflow: s.hasPageHorizontalOverflow,
    };
  });

  return {
    targetUrl,
    timestamp: new Date().toISOString(),
    breakpoints,
    totalElementsScanned: alignedElements.length,
    totalIssuesFound: issues.length,
    issuesByCategory,
    issuesBySeverity,
    issues,
    pageSnapshots: pageSnapshotMap,
  };
}
