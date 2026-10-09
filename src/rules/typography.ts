import { PageSnapshot, AlignedElement, InconsistencyIssue } from '../types.js';

export function evaluateTypographyRules(
  pageSnapshots: PageSnapshot[],
  alignedElements: AlignedElement[]
): InconsistencyIssue[] {
  const issues: InconsistencyIssue[] = [];

  // RULE-T1: Heading Hierarchy Inversion within each breakpoint
  pageSnapshots.forEach((snap) => {
    const bp = snap.breakpoint;
    const headings = snap.elements.filter(
      (el) => el.isVisible && ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(el.tagName)
    );

    const h1List = headings.filter((h) => h.tagName === 'h1');
    const h2List = headings.filter((h) => h.tagName === 'h2');
    const h3List = headings.filter((h) => h.tagName === 'h3');

    // Compare H2 vs H1
    h2List.forEach((h2) => {
      const smallerH1 = h1List.find((h1) => h2.style.fontSize > h1.style.fontSize + 1);
      if (smallerH1) {
        issues.push({
          id: `issue-heading-hierarchy-h2-${h2.domPath}-${bp}`,
          ruleId: 'RULE-T1',
          category: 'TYPOGRAPHY',
          severity: 'HIGH',
          title: 'Inversi Hierarki Heading (H2 Lebih Besar dari H1)',
          message: `Pada viewport ${bp}px, elemen <h2> memiliki ukuran font (${h2.style.fontSize}px) yang lebih besar daripada elemen <h1> (${smallerH1.style.fontSize}px).`,
          elementDomPath: h2.domPath,
          elementTagName: 'h2',
          elementText: h2.textPreview,
          affectedBreakpoints: [bp],
          propertyComparison: {
            [bp]: `H2 (${h2.style.fontSize}px) > H1 (${smallerH1.style.fontSize}px)`,
          },
          recommendation:
            'Pertahankan hierarki tipografi visual yang konsisten di mana judul tingkat lebih tinggi (H1) selalu lebih besar atau sama dengan sub-judul (H2).',
        });
      }
    });

    // Compare H3 vs H2
    h3List.forEach((h3) => {
      const smallerH2 = h2List.find((h2) => h3.style.fontSize > h2.style.fontSize + 1);
      if (smallerH2) {
        issues.push({
          id: `issue-heading-hierarchy-h3-${h3.domPath}-${bp}`,
          ruleId: 'RULE-T1',
          category: 'TYPOGRAPHY',
          severity: 'MEDIUM',
          title: 'Inversi Hierarki Heading (H3 Lebih Besar dari H2)',
          message: `Pada viewport ${bp}px, elemen <h3> memiliki ukuran font (${h3.style.fontSize}px) yang lebih besar daripada elemen <h2> (${smallerH2.style.fontSize}px).`,
          elementDomPath: h3.domPath,
          elementTagName: 'h3',
          elementText: h3.textPreview,
          affectedBreakpoints: [bp],
          propertyComparison: {
            [bp]: `H3 (${h3.style.fontSize}px) > H2 (${smallerH2.style.fontSize}px)`,
          },
          recommendation:
            'Sesuaikan font-size H3 agar lebih proporsional terhadap H2 pada stylesheet responsif.',
        });
      }
    });
  });

  // RULE-T2: Line-Height Collapse (Teks Bertumpuk)
  alignedElements.forEach((aligned) => {
    const textTags = new Set(['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'span', 'li', 'a', 'label']);
    if (!textTags.has(aligned.tagName)) return;

    const affectedBps: number[] = [];
    const comparison: Record<number, string> = {};

    Object.entries(aligned.snapshots).forEach(([bpStr, snap]) => {
      const bp = parseInt(bpStr, 10);
      if (!snap || !snap.isVisible) return;

      if (snap.style.fontSize >= 12 && snap.style.lineHeight < snap.style.fontSize - 1) {
        affectedBps.push(bp);
        comparison[bp] = `font: ${snap.style.fontSize}px, line-height: ${snap.style.lineHeight}px`;
      }
    });

    if (affectedBps.length > 0) {
      issues.push({
        id: `issue-line-height-collapse-${aligned.key}`,
        ruleId: 'RULE-T2',
        category: 'TYPOGRAPHY',
        severity: 'CRITICAL',
        title: 'Line-Height Collapse (Teks Berpotensi Tumpang Tindih)',
        message: `Elemen <${aligned.tagName}> memiliki line-height lebih kecil dari ukuran font-nya pada breakpoint: ${affectedBps.join(', ')}px, berisiko membuat baris teks bertumpuk.`,
        elementDomPath: aligned.domPath,
        elementTagName: aligned.tagName,
        elementText: aligned.textPreview,
        affectedBreakpoints: affectedBps,
        propertyComparison: comparison,
        recommendation:
          'Gunakan rasio line-height minimal 1.2 hingga 1.5 kali dari font-size untuk kenyamanan membaca.',
      });
    }
  });

  // RULE-T3: Font Size Scaling Inversion across breakpoints (Mobile larger than Desktop)
  alignedElements.forEach((aligned) => {
    const mobileSnap = aligned.snapshots[320];
    const desktopSnap = aligned.snapshots[1440] || aligned.snapshots[1024];

    if (mobileSnap && desktopSnap && mobileSnap.isVisible && desktopSnap.isVisible) {
      const fontDiff = mobileSnap.style.fontSize - desktopSnap.style.fontSize;
      // If mobile font is larger than desktop by more than 4px
      if (fontDiff > 4) {
        issues.push({
          id: `issue-font-scaling-inversion-${aligned.key}`,
          ruleId: 'RULE-T3',
          category: 'TYPOGRAPHY',
          severity: 'MEDIUM',
          title: 'Inversi Skala Tipografi Lintas Breakpoint',
          message: `Ukuran font pada mobile 320px (${mobileSnap.style.fontSize}px) justru lebih besar secara signifikan dibanding desktop (${desktopSnap.style.fontSize}px).`,
          elementDomPath: aligned.domPath,
          elementTagName: aligned.tagName,
          elementText: aligned.textPreview,
          affectedBreakpoints: [320, 1440],
          propertyComparison: {
            320: `${mobileSnap.style.fontSize}px`,
            1440: `${desktopSnap.style.fontSize}px`,
          },
          recommendation:
            'Periksa media query CSS. Pastikan ukuran font membesar atau stabil saat viewport bertambah besar.',
        });
      }
    }
  });

  // RULE-T4: Minimum Legibility on Mobile (320px < 12px)
  alignedElements.forEach((aligned) => {
    const mobileSnap = aligned.snapshots[320];
    const bodyTags = new Set(['p', 'span', 'li', 'a']);
    if (mobileSnap && mobileSnap.isVisible && bodyTags.has(aligned.tagName) && mobileSnap.textPreview) {
      if (mobileSnap.style.fontSize < 11.5 && mobileSnap.style.fontSize > 0) {
        issues.push({
          id: `issue-min-font-legibility-${aligned.key}`,
          ruleId: 'RULE-T4',
          category: 'TYPOGRAPHY',
          severity: 'MEDIUM',
          title: 'Ukuran Font Terlalu Kecil pada Layar Ponsel (< 12px)',
          message: `Teks pada elemen <${aligned.tagName}> berukuran ${mobileSnap.style.fontSize}px pada breakpoint 320px, berisiko sulit dibaca oleh pengguna ponsel.`,
          elementDomPath: aligned.domPath,
          elementTagName: aligned.tagName,
          elementText: aligned.textPreview,
          affectedBreakpoints: [320],
          propertyComparison: {
            320: `${mobileSnap.style.fontSize}px`,
          },
          recommendation:
            'Gunakan ukuran font minimal 12px (direkomendasikan 14px–16px untuk body text) pada layar kecil untuk keterbacaan.',
        });
      }
    }
  });

  return issues;
}
