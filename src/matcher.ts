import { PageSnapshot, Breakpoint, AlignedElement } from './types.js';

/**
 * Aligns elements across multiple breakpoint snapshots using ID and Normalized DOM Path.
 */
export function alignElementsAcrossBreakpoints(
  snapshots: PageSnapshot[],
  breakpoints: Breakpoint[]
): AlignedElement[] {
  const elementMap = new Map<string, AlignedElement>();

  snapshots.forEach((pageSnap) => {
    const bp = pageSnap.breakpoint;

    pageSnap.elements.forEach((el) => {
      // Prioritize ID if valid and unique, otherwise fallback to normalized DOM Path
      const alignmentKey = el.id ? `id:#${el.id}` : `dom:${el.domPath}`;

      if (!elementMap.has(alignmentKey)) {
        const initialSnapshots: Record<Breakpoint, any> = {};
        breakpoints.forEach((b) => {
          initialSnapshots[b] = null;
        });

        elementMap.set(alignmentKey, {
          key: alignmentKey,
          id: el.id,
          domPath: el.domPath,
          tagName: el.tagName,
          textPreview: el.textPreview,
          snapshots: initialSnapshots,
        });
      }

      const aligned = elementMap.get(alignmentKey)!;
      aligned.snapshots[bp] = el;
      // Keep most descriptive text preview
      if (!aligned.textPreview && el.textPreview) {
        aligned.textPreview = el.textPreview;
      }
    });
  });

  return Array.from(elementMap.values());
}
