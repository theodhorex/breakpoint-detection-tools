import { Page } from 'playwright';
import { PageSnapshot, Breakpoint } from './types.js';

/**
 * Extracts computed styles and geometry from the rendered page for a specific breakpoint.
 */
export async function extractPageSnapshot(page: Page, breakpoint: Breakpoint): Promise<PageSnapshot> {
  const snapshotData = await page.evaluate((bp: number) => {
    // Helper to parse CSS px value to number
    function parsePx(value: string | null | undefined): number {
      if (!value) return 0;
      const num = parseFloat(value);
      return isNaN(num) ? 0 : num;
    }

    // Helper to generate a normalized, deterministic DOM Path
    function getNormalizedDomPath(el: Element): string {
      const parts: string[] = [];
      let current: Element | null = el;

      while (current && current.nodeType === Node.ELEMENT_NODE) {
        if (current === document.body) {
          parts.unshift('BODY');
          break;
        }

        const tagName = current.tagName.toUpperCase();
        let index = 1;
        let sibling = current.previousElementSibling;

        while (sibling) {
          if (sibling.tagName.toUpperCase() === tagName) {
            index++;
          }
          sibling = sibling.previousElementSibling;
        }

        parts.unshift(`${tagName}:nth-of-type(${index})`);
        current = current.parentElement;
      }

      return parts.join(' > ');
    }

    const docScrollWidth = document.documentElement.scrollWidth;
    const bodyScrollWidth = document.body ? document.body.scrollWidth : 0;
    const maxScrollWidth = Math.max(docScrollWidth, bodyScrollWidth);
    const winInnerWidth = window.innerWidth;
    const hasPageOverflow = maxScrollWidth > winInnerWidth + 1; // 1px threshold for subpixel rounding

    const ignoredTags = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'TEMPLATE', 'HEAD', 'META', 'LINK', 'BR']);
    const allElements = document.querySelectorAll('*');
    const elementSnapshots: any[] = [];

    allElements.forEach((el) => {
      const tagName = el.tagName.toUpperCase();
      if (ignoredTags.has(tagName)) return;
      if (el === document.documentElement) return;

      const style = window.getComputedStyle(el);
      const rect = el.getBoundingClientRect();

      // Check basic visibility
      const isVisible =
        style.display !== 'none' &&
        style.visibility !== 'hidden' &&
        parseFloat(style.opacity || '1') > 0 &&
        rect.width > 0 &&
        rect.height > 0;

      // Extract text excerpt if any
      let textPreview = '';
      if (el.childNodes.length > 0) {
        for (let i = 0; i < el.childNodes.length; i++) {
          const node = el.childNodes[i];
          if (node.nodeType === Node.TEXT_NODE && node.textContent?.trim()) {
            textPreview += node.textContent.trim() + ' ';
            if (textPreview.length > 60) break;
          }
        }
      }
      textPreview = textPreview.trim().slice(0, 60);

      // Resolve computed line-height
      let computedLineHeight = parsePx(style.lineHeight);
      if (style.lineHeight === 'normal' || computedLineHeight === 0) {
        // Fallback approximation: 1.2 * fontSize
        computedLineHeight = parsePx(style.fontSize) * 1.2;
      }

      elementSnapshots.push({
        id: el.id || '',
        domPath: getNormalizedDomPath(el),
        tagName: tagName.toLowerCase(),
        textPreview: textPreview,
        classes: Array.from(el.classList),
        isVisible,
        style: {
          fontSize: parsePx(style.fontSize),
          fontSizeRaw: style.fontSize,
          lineHeight: computedLineHeight,
          lineHeightRaw: style.lineHeight,
          fontWeight: style.fontWeight,
          fontFamily: style.fontFamily,

          marginTop: parsePx(style.marginTop),
          marginRight: parsePx(style.marginRight),
          marginBottom: parsePx(style.marginBottom),
          marginLeft: parsePx(style.marginLeft),

          paddingTop: parsePx(style.paddingTop),
          paddingRight: parsePx(style.paddingRight),
          paddingBottom: parsePx(style.paddingBottom),
          paddingLeft: parsePx(style.paddingLeft),

          rowGap: parsePx(style.rowGap),
          columnGap: parsePx(style.columnGap),

          display: style.display,
          position: style.position,
          overflowX: style.overflowX,
          overflowY: style.overflowY,
          boxSizing: style.boxSizing,
        },
        geometry: {
          rect: {
            x: rect.x,
            y: rect.y,
            width: rect.width,
            height: rect.height,
            top: rect.top,
            right: rect.right,
            bottom: rect.bottom,
            left: rect.left,
          },
          scrollWidth: el.scrollWidth,
          clientWidth: el.clientWidth,
          scrollHeight: el.scrollHeight,
          clientHeight: el.clientHeight,
        },
      });
    });

    return {
      breakpoint: bp,
      viewportWidth: winInnerWidth,
      viewportHeight: window.innerHeight,
      documentScrollWidth: maxScrollWidth,
      windowInnerWidth: winInnerWidth,
      hasPageHorizontalOverflow: hasPageOverflow,
      elements: elementSnapshots,
    };
  }, breakpoint);

  return snapshotData;
}
