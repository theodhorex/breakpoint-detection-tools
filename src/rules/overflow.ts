import { PageSnapshot, AlignedElement, InconsistencyIssue } from '../types.js';

export function evaluateOverflowRules(
  pageSnapshots: PageSnapshot[],
  alignedElements: AlignedElement[]
): InconsistencyIssue[] {
  const issues: InconsistencyIssue[] = [];

  // RULE-O1: WCAG 2.1 Reflow 1.4.10 (Horizontal Scroll at 320px)
  const mobileSnapshot = pageSnapshots.find((s) => s.breakpoint === 320);
  if (mobileSnapshot && mobileSnapshot.hasPageHorizontalOverflow) {
    const diff = Math.round(mobileSnapshot.documentScrollWidth - mobileSnapshot.windowInnerWidth);

    // Identify primary spilling elements on 320px
    const spillingElements = mobileSnapshot.elements
      .filter((el) => el.isVisible && el.geometry.rect.right > mobileSnapshot.windowInnerWidth + 1)
      .slice(0, 3)
      .map((el) => `<${el.tagName}> (${el.id ? '#' + el.id : el.domPath})`)
      .join(', ');

    issues.push({
      id: 'issue-wcag-reflow-320',
      ruleId: 'RULE-O1',
      category: 'OVERFLOW',
      severity: 'CRITICAL',
      title: 'Pelanggaran WCAG 2.1 Reflow (Horizontal Scrollbar pada 320px)',
      message: `Halaman meluap sebesar ${diff}px melampaui viewport 320px (scrollWidth: ${mobileSnapshot.documentScrollWidth}px vs viewport: ${mobileSnapshot.windowInnerWidth}px). Elemen penyebab terdeteksi: ${spillingElements || 'elemen konten lebar'}.`,
      elementDomPath: 'BODY',
      elementTagName: 'body',
      affectedBreakpoints: [320],
      propertyComparison: {
        320: `${mobileSnapshot.documentScrollWidth}px / ${mobileSnapshot.windowInnerWidth}px (Meluap ${diff}px)`,
      },
      recommendation:
        'Pastikan tidak ada elemen dengan lebar fixed (misal min-width > 320px, fixed width px). Gunakan max-width: 100% dan overflow-wrap: break-word.',
    });
  }

  // RULE-O2: Individual Element Viewport Spillover across breakpoints
  alignedElements.forEach((aligned) => {
    const affectedBps: number[] = [];
    const comparison: Record<number, string> = {};

    Object.entries(aligned.snapshots).forEach(([bpStr, snap]) => {
      const bp = parseInt(bpStr, 10);
      if (!snap || !snap.isVisible) return;

      const pageSnap = pageSnapshots.find((p) => p.breakpoint === bp);
      if (!pageSnap) return;

      const rightSpill = snap.geometry.rect.right - pageSnap.windowInnerWidth;
      if (rightSpill > 2 && snap.geometry.rect.left < pageSnap.windowInnerWidth) {
        affectedBps.push(bp);
        comparison[bp] = `Melampaui viewport sebesar +${Math.round(rightSpill)}px (right: ${Math.round(snap.geometry.rect.right)}px, viewport: ${pageSnap.windowInnerWidth}px)`;
      }
    });

    if (affectedBps.length > 0) {
      issues.push({
        id: `issue-elem-spill-${aligned.key}`,
        ruleId: 'RULE-O2',
        category: 'OVERFLOW',
        severity: 'HIGH',
        title: 'Elemen Melampaui Batas Viewport Layar',
        message: `Elemen <${aligned.tagName}> meluap keluar dari batas viewport layar pada breakpoint: ${affectedBps.join(', ')}px.`,
        elementDomPath: aligned.domPath,
        elementTagName: aligned.tagName,
        elementText: aligned.textPreview,
        affectedBreakpoints: affectedBps,
        propertyComparison: comparison,
        recommendation:
          'Hindari nilai width/min-width statis. Terapkan max-width: 100%, box-sizing: border-box, atau fluid sizing.',
      });
    }
  });

  // RULE-O4: Negative coordinate cutoff (Left cutoff)
  alignedElements.forEach((aligned) => {
    const affectedBps: number[] = [];
    const comparison: Record<number, string> = {};

    Object.entries(aligned.snapshots).forEach(([bpStr, snap]) => {
      const bp = parseInt(bpStr, 10);
      if (!snap || !snap.isVisible) return;

      if (snap.geometry.rect.left < -3) {
        affectedBps.push(bp);
        comparison[bp] = `rect.left = ${Math.round(snap.geometry.rect.left)}px`;
      }
    });

    if (affectedBps.length > 0) {
      issues.push({
        id: `issue-left-cutoff-${aligned.key}`,
        ruleId: 'RULE-O4',
        category: 'OVERFLOW',
        severity: 'MEDIUM',
        title: 'Konten Elemen Terpotong di Tepi Kiri Layar',
        message: `Elemen <${aligned.tagName}> memiliki posisi horizontal negatif sehingga sebagian konten terpotong pada breakpoint: ${affectedBps.join(', ')}px.`,
        elementDomPath: aligned.domPath,
        elementTagName: aligned.tagName,
        elementText: aligned.textPreview,
        affectedBreakpoints: affectedBps,
        propertyComparison: comparison,
        recommendation:
          'Periksa apakah terdapat nilai margin-left negatif atau transformasi translate negatif yang berlebihan pada layar kecil.',
      });
    }
  });

  return issues;
}
