import { AuditReport, InconsistencyIssue } from './types.js';

/**
 * Generates an interactive, standalone HTML report for the audit results.
 */
export function generateHtmlReport(report: AuditReport): string {
  const severityColors: Record<string, { bg: string; text: string; border: string }> = {
    CRITICAL: { bg: '#fee2e2', text: '#991b1b', border: '#ef4444' },
    HIGH: { bg: '#ffedd5', text: '#9a3412', border: '#f97316' },
    MEDIUM: { bg: '#fef9c3', text: '#854d0e', border: '#eab308' },
    LOW: { bg: '#e0f2fe', text: '#075985', border: '#38bdf8' },
  };

  const categoryIcons: Record<string, string> = {
    OVERFLOW: '↔️',
    TYPOGRAPHY: '🔤',
    SPACING: '📐',
  };

  const issuesHtml = report.issues
    .map((issue, index) => {
      const colors = severityColors[issue.severity] || severityColors.LOW;
      const icon = categoryIcons[issue.category] || '⚠️';

      const comparisonRows = Object.entries(issue.propertyComparison)
        .map(
          ([bp, val]) => `
          <tr>
            <td style="padding: 6px 12px; font-weight: 600; border: 1px solid #e5e7eb;">${bp}px</td>
            <td style="padding: 6px 12px; font-family: monospace; border: 1px solid #e5e7eb; color: #1f2937;">${val}</td>
          </tr>
        `
        )
        .join('');

      return `
      <div style="background: white; border-radius: 8px; border: 1px solid #e5e7eb; border-left: 5px solid ${colors.border}; padding: 18px; margin-bottom: 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="font-size: 1.25rem;">${icon}</span>
            <span style="font-weight: 700; font-size: 1.1rem; color: #111827;">#${index + 1} ${issue.title}</span>
          </div>
          <div style="display: flex; gap: 8px;">
            <span style="background: #f3f4f6; color: #374151; padding: 3px 8px; border-radius: 4px; font-size: 0.75rem; font-weight: 600;">${issue.ruleId}</span>
            <span style="background: ${colors.bg}; color: ${colors.text}; padding: 3px 10px; border-radius: 4px; font-size: 0.75rem; font-weight: 700;">${issue.severity}</span>
          </div>
        </div>

        <p style="color: #4b5563; margin: 8px 0; line-height: 1.5;">${issue.message}</p>

        <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 6px; padding: 10px 14px; margin: 12px 0; font-size: 0.85rem;">
          <div style="color: #6b7280; margin-bottom: 4px;"><strong>Target Elemen:</strong> <code>&lt;${issue.elementTagName}&gt;</code> | <code>${issue.elementDomPath}</code></div>
          ${issue.elementText ? `<div style="color: #4b5563;"><strong>Cuplikan Teks:</strong> "<em>${issue.elementText}</em>"</div>` : ''}
        </div>

        <div style="margin: 12px 0;">
          <div style="font-size: 0.85rem; font-weight: 600; color: #374151; margin-bottom: 6px;">Perbandingan Nilai Properti Lintas Breakpoint:</div>
          <table style="width: 100%; border-collapse: collapse; font-size: 0.85rem; background: white;">
            <thead>
              <tr style="background: #f3f4f6; text-align: left;">
                <th style="padding: 6px 12px; border: 1px solid #e5e7eb; width: 140px;">Breakpoint</th>
                <th style="padding: 6px 12px; border: 1px solid #e5e7eb;">Nilai / Kondisi Terdeteksi</th>
              </tr>
            </thead>
            <tbody>
              ${comparisonRows}
            </tbody>
          </table>
        </div>

        <div style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 6px; padding: 8px 12px; font-size: 0.85rem; color: #1e40af; margin-top: 10px;">
          💡 <strong>Rekomendasi Perbaikan:</strong> ${issue.recommendation}
        </div>
      </div>
    `;
    })
    .join('');

  return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Laporan Konsistensi Desain Responsif</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; background: #f8fafc; color: #0f172a; margin: 0; padding: 24px; }
    .container { max-width: 1000px; margin: 0 auto; }
    .header { background: white; border-radius: 12px; padding: 24px; margin-bottom: 24px; box-shadow: 0 1px 3px rgba(0,0,0,0.05); border: 1px solid #e2e8f0; }
    .stat-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 16px; margin-top: 20px; }
    .stat-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; text-align: center; }
    .stat-value { font-size: 1.8rem; font-weight: 800; margin-top: 4px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px;">
        <div>
          <h1 style="margin: 0; font-size: 1.5rem; color: #1e293b;">Laporan Konsistensi Desain Antarmuka Responsif</h1>
          <p style="margin: 6px 0 0; color: #64748b; font-size: 0.9rem;">Target Audit: <strong>${report.targetUrl}</strong> | Dibuat pada: ${new Date(report.timestamp).toLocaleString('id-ID')}</p>
        </div>
        <div style="background: #e0e7ff; color: #3730a3; padding: 6px 14px; border-radius: 20px; font-size: 0.85rem; font-weight: 600;">
          Breakpoint: ${report.breakpoints.map((b) => b + 'px').join(', ')}
        </div>
      </div>

      <div class="stat-grid">
        <div class="stat-card">
          <div style="font-size: 0.8rem; color: #64748b; font-weight: 600;">TOTAL ELEMEN DIINSPEKSI</div>
          <div class="stat-value" style="color: #0284c7;">${report.totalElementsScanned}</div>
        </div>
        <div class="stat-card">
          <div style="font-size: 0.8rem; color: #64748b; font-weight: 600;">TOTAL TEMUAN CACAT</div>
          <div class="stat-value" style="color: #dc2626;">${report.totalIssuesFound}</div>
        </div>
        <div class="stat-card">
          <div style="font-size: 0.8rem; color: #64748b; font-weight: 600;">CRITICAL / HIGH</div>
          <div class="stat-value" style="color: #b91c1c;">${(report.issuesBySeverity.CRITICAL || 0) + (report.issuesBySeverity.HIGH || 0)}</div>
        </div>
        <div class="stat-card">
          <div style="font-size: 0.8rem; color: #64748b; font-weight: 600;">MEDIUM / LOW</div>
          <div class="stat-value" style="color: #d97706;">${(report.issuesBySeverity.MEDIUM || 0) + (report.issuesBySeverity.LOW || 0)}</div>
        </div>
      </div>
    </div>

    <h2 style="font-size: 1.25rem; color: #1e293b; margin-bottom: 16px;">Daftar Temuan Inkonsistensi Desain (${report.issues.length})</h2>
    ${report.issues.length === 0 ? '<div style="background: #ecfdf5; border: 1px solid #a7f3d0; color: #065f46; padding: 24px; border-radius: 8px; text-align: center; font-weight: 600;">🎉 Hebat! Tidak ditemukan anomali responsif pada seluruh breakpoint yang diuji.</div>' : issuesHtml}
  </div>
</body>
</html>`;
}

/**
 * Prints a clean, colorized CLI summary report to the terminal.
 */
export function printCliSummary(report: AuditReport): void {
  console.log('\n===============================================================');
  console.log('   LAPORAN AUDIT KONSISTENSI ANTARMUKA RESPONSIF MULTI-BREAKPOINT   ');
  console.log('===============================================================');
  console.log(` Target URL       : ${report.targetUrl}`);
  console.log(` Breakpoints      : ${report.breakpoints.map((b) => b + 'px').join(', ')}`);
  console.log(` Total Elemen     : ${report.totalElementsScanned} elemen`);
  console.log(` Total Temuan     : ${report.totalIssuesFound} cacat inkonsistensi`);
  console.log('---------------------------------------------------------------');
  console.log(' Rincian Kategori:');
  console.log(`   - OVERFLOW     : ${report.issuesByCategory.OVERFLOW || 0}`);
  console.log(`   - TYPOGRAPHY   : ${report.issuesByCategory.TYPOGRAPHY || 0}`);
  console.log(`   - SPACING      : ${report.issuesByCategory.SPACING || 0}`);
  console.log('---------------------------------------------------------------');
  console.log(' Rincian Keparahan:');
  console.log(`   - CRITICAL     : ${report.issuesBySeverity.CRITICAL || 0}`);
  console.log(`   - HIGH         : ${report.issuesBySeverity.HIGH || 0}`);
  console.log(`   - MEDIUM       : ${report.issuesBySeverity.MEDIUM || 0}`);
  console.log(`   - LOW          : ${report.issuesBySeverity.LOW || 0}`);
  console.log('===============================================================\n');

  if (report.issues.length > 0) {
    console.log('DAFTAR TEMUAN TERATAS:');
    report.issues.forEach((issue, idx) => {
      console.log(`\n[${issue.severity}] #${idx + 1} ${issue.title} (${issue.ruleId})`);
      console.log(`  • Pesan    : ${issue.message}`);
      console.log(`  • Elemen   : <${issue.elementTagName}> ${issue.elementDomPath}`);
      console.log(`  • Solusi   : ${issue.recommendation}`);
    });
    console.log('\n===============================================================');
  }
}
