import { PageSnapshot, AlignedElement, InconsistencyIssue } from '../types.js';

export function evaluateSpacingRules(
  pageSnapshots: PageSnapshot[],
  alignedElements: AlignedElement[]
): InconsistencyIssue[] {
  const issues: InconsistencyIssue[] = [];

  // RULE-S1: Disproportionate Mobile Margin Inflation (Fixed Margin Trap)
  alignedElements.forEach((aligned) => {
    const mobileSnap = aligned.snapshots[320];
    const desktopSnap = aligned.snapshots[1440] || aligned.snapshots[1024];

    if (mobileSnap && mobileSnap.isVisible) {
      const mobileTotalHorizMargin = mobileSnap.style.marginLeft + mobileSnap.style.marginRight;

      // Condition A: Mobile horizontal margin eats more than 25% of 320px screen width (> 80px)
      if (mobileTotalHorizMargin > 80) {
        issues.push({
          id: `issue-mobile-margin-inflation-${aligned.key}`,
          ruleId: 'RULE-S1',
          category: 'SPACING',
          severity: 'HIGH',
          title: 'Margin Horizontal Terlalu Lebar pada Layar Ponsel',
          message: `Elemen <${aligned.tagName}> memiliki total margin horizontal sebesar ${Math.round(mobileTotalHorizMargin)}px pada layar 320px (memakan ${(mobileTotalHorizMargin / 3.2).toFixed(0)}% ruang layar).`,
          elementDomPath: aligned.domPath,
          elementTagName: aligned.tagName,
          elementText: aligned.textPreview,
          affectedBreakpoints: [320],
          propertyComparison: {
            320: `kiri: ${mobileSnap.style.marginLeft}px, kanan: ${mobileSnap.style.marginRight}px`,
          },
          recommendation:
            'Gunakan media query untuk memperkecil margin horizontal pada layar mobile (misal 16px atau 1rem).',
        });
      }
      // Condition B: Mobile margin is significantly larger than desktop margin (inversion anomaly)
      else if (desktopSnap && desktopSnap.isVisible) {
        const desktopTotalHorizMargin = desktopSnap.style.marginLeft + desktopSnap.style.marginRight;
        if (mobileTotalHorizMargin - desktopTotalHorizMargin > 24) {
          issues.push({
            id: `issue-margin-inversion-${aligned.key}`,
            ruleId: 'RULE-S1',
            category: 'SPACING',
            severity: 'MEDIUM',
            title: 'Anomali Margin: Nilai Mobile Lebih Besar dari Desktop',
            message: `Margin horizontal pada mobile (${mobileTotalHorizMargin}px) lebih besar dibanding pada desktop (${desktopTotalHorizMargin}px).`,
            elementDomPath: aligned.domPath,
            elementTagName: aligned.tagName,
            elementText: aligned.textPreview,
            affectedBreakpoints: [320, 1440],
            propertyComparison: {
              320: `${mobileTotalHorizMargin}px`,
              1440: `${desktopTotalHorizMargin}px`,
            },
            recommendation:
              'Sesuaikan margin agar bertambah seiring bertambahnya lebar layar secara harmonis.',
          });
        }
      }
    }
  });

  // RULE-S2: Disproportionate Padding Inflation on Mobile
  alignedElements.forEach((aligned) => {
    const mobileSnap = aligned.snapshots[320];
    if (mobileSnap && mobileSnap.isVisible) {
      const mobileTotalHorizPadding = mobileSnap.style.paddingLeft + mobileSnap.style.paddingRight;
      if (mobileTotalHorizPadding > 100) {
        issues.push({
          id: `issue-mobile-padding-inflation-${aligned.key}`,
          ruleId: 'RULE-S2',
          category: 'SPACING',
          severity: 'HIGH',
          title: 'Padding Horizontal Berlebihan pada Layar Ponsel',
          message: `Padding horizontal elemen <${aligned.tagName}> pada 320px adalah ${Math.round(mobileTotalHorizPadding)}px, menyisakan area konten yang sangat sempit.`,
          elementDomPath: aligned.domPath,
          elementTagName: aligned.tagName,
          elementText: aligned.textPreview,
          affectedBreakpoints: [320],
          propertyComparison: {
            320: `kiri: ${mobileSnap.style.paddingLeft}px, kanan: ${mobileSnap.style.paddingRight}px`,
          },
          recommendation:
            'Gunakan padding responsif (misal padding: 12px atau 1rem pada layar kecil).',
        });
      }
    }
  });

  return issues;
}
