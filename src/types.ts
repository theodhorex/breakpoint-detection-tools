export type Breakpoint = number;

export type IssueSeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export type IssueCategory = 'OVERFLOW' | 'TYPOGRAPHY' | 'SPACING';

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export interface GeometryData {
  rect: BoundingBox;
  scrollWidth: number;
  clientWidth: number;
  scrollHeight: number;
  clientHeight: number;
}

export interface ComputedStyleData {
  // Typography
  fontSize: number; // in pixels
  fontSizeRaw: string;
  lineHeight: number; // in pixels
  lineHeightRaw: string;
  fontWeight: string;
  fontFamily: string;

  // Spacing (in pixels)
  marginTop: number;
  marginRight: number;
  marginBottom: number;
  marginLeft: number;
  paddingTop: number;
  paddingRight: number;
  paddingBottom: number;
  paddingLeft: number;
  rowGap: number;
  columnGap: number;

  // Display & Overflow
  display: string;
  position: string;
  overflowX: string;
  overflowY: string;
  boxSizing: string;
}

export interface ElementSnapshot {
  id: string;
  domPath: string;
  tagName: string;
  textPreview: string;
  classes: string[];
  style: ComputedStyleData;
  geometry: GeometryData;
  isVisible: boolean;
}

export interface PageSnapshot {
  breakpoint: Breakpoint;
  viewportWidth: number;
  viewportHeight: number;
  documentScrollWidth: number;
  windowInnerWidth: number;
  hasPageHorizontalOverflow: boolean;
  elements: ElementSnapshot[];
}

export interface AlignedElement {
  key: string;
  id: string;
  domPath: string;
  tagName: string;
  textPreview: string;
  snapshots: Record<Breakpoint, ElementSnapshot | null>;
}

export interface InconsistencyIssue {
  id: string;
  ruleId: string;
  category: IssueCategory;
  severity: IssueSeverity;
  title: string;
  message: string;
  elementDomPath: string;
  elementTagName: string;
  elementText?: string;
  affectedBreakpoints: Breakpoint[];
  propertyComparison: Record<Breakpoint, string | number>;
  recommendation: string;
}

export interface AuditReport {
  targetUrl: string;
  timestamp: string;
  breakpoints: Breakpoint[];
  totalElementsScanned: number;
  totalIssuesFound: number;
  issuesByCategory: Record<IssueCategory, number>;
  issuesBySeverity: Record<IssueSeverity, number>;
  issues: InconsistencyIssue[];
  pageSnapshots: Record<Breakpoint, {
    documentScrollWidth: number;
    windowInnerWidth: number;
    hasOverflow: boolean;
  }>;
}
