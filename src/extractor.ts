import { Page } from 'playwright';
import { PageSnapshot, Breakpoint } from './types.js';

const INJECTED_EXTRACTION_SCRIPT = `
(function(bp) {
  function parsePx(val) {
    if (!val) return 0;
    var num = parseFloat(val);
    return isNaN(num) ? 0 : num;
  }

  function getNormalizedDomPath(el) {
    var parts = [];
    var current = el;

    while (current && current.nodeType === 1) {
      if (current === document.body) {
        parts.unshift('BODY');
        break;
      }

      var tagName = current.tagName.toUpperCase();
      var index = 1;
      var sibling = current.previousElementSibling;

      while (sibling) {
        if (sibling.tagName.toUpperCase() === tagName) {
          index++;
        }
        sibling = sibling.previousElementSibling;
      }

      parts.unshift(tagName + ':nth-of-type(' + index + ')');
      current = current.parentElement;
    }

    return parts.join(' > ');
  }

  var docScrollWidth = document.documentElement.scrollWidth;
  var bodyScrollWidth = document.body ? document.body.scrollWidth : 0;
  var maxScrollWidth = Math.max(docScrollWidth, bodyScrollWidth);
  var winInnerWidth = window.innerWidth;
  var hasPageOverflow = maxScrollWidth > winInnerWidth + 1;

  var ignoredTags = { 'SCRIPT': 1, 'STYLE': 1, 'NOSCRIPT': 1, 'TEMPLATE': 1, 'HEAD': 1, 'META': 1, 'LINK': 1, 'BR': 1 };
  var allElements = document.querySelectorAll('*');
  var elementSnapshots = [];

  for (var i = 0; i < allElements.length; i++) {
    var el = allElements[i];
    var tagName = el.tagName.toUpperCase();
    if (ignoredTags[tagName]) continue;
    if (el === document.documentElement) continue;

    var style = window.getComputedStyle(el);
    var rect = el.getBoundingClientRect();

    var isVisible =
      style.display !== 'none' &&
      style.visibility !== 'hidden' &&
      parseFloat(style.opacity || '1') > 0 &&
      rect.width > 0 &&
      rect.height > 0;

    var textPreview = '';
    if (el.childNodes.length > 0) {
      for (var j = 0; j < el.childNodes.length; j++) {
        var node = el.childNodes[j];
        if (node.nodeType === 3 && node.textContent && node.textContent.trim()) {
          textPreview += node.textContent.trim() + ' ';
          if (textPreview.length > 60) break;
        }
      }
    }
    textPreview = textPreview.trim().slice(0, 60);

    var computedLineHeight = parsePx(style.lineHeight);
    if (style.lineHeight === 'normal' || computedLineHeight === 0) {
      computedLineHeight = parsePx(style.fontSize) * 1.2;
    }

    elementSnapshots.push({
      id: el.id || '',
      domPath: getNormalizedDomPath(el),
      tagName: tagName.toLowerCase(),
      textPreview: textPreview,
      classes: Array.from(el.classList),
      isVisible: isVisible,
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
        boxSizing: style.boxSizing
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
          left: rect.left
        },
        scrollWidth: el.scrollWidth,
        clientWidth: el.clientWidth,
        scrollHeight: el.scrollHeight,
        clientHeight: el.clientHeight
      }
    });
  }

  return {
    breakpoint: bp,
    viewportWidth: winInnerWidth,
    viewportHeight: window.innerHeight,
    documentScrollWidth: maxScrollWidth,
    windowInnerWidth: winInnerWidth,
    hasPageHorizontalOverflow: hasPageOverflow,
    elements: elementSnapshots
  };
})
`;

/**
 * Extracts computed styles and geometry from the rendered page for a specific breakpoint.
 */
export async function extractPageSnapshot(page: Page, breakpoint: Breakpoint): Promise<PageSnapshot> {
  const result = await page.evaluate(
    `(${INJECTED_EXTRACTION_SCRIPT})(${breakpoint})`
  );
  return result as PageSnapshot;
}
