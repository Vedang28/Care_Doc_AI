import { formatDate, formatTime, formatDuration } from '@/lib/utils'

interface ReportTemplateData {
  reportId: string
  agencyName: string
  agencyLogoUrl?: string | null
  clientName: string
  caregiverName: string
  checkInAt: Date
  checkOutAt: Date | null
  taskCount: number
  flags: string[]
  reportText: string
  signedByName: string
  signedAt: Date
}

export function buildReportHtml(data: ReportTemplateData): string {
  const {
    reportId, agencyName, clientName, caregiverName,
    checkInAt, checkOutAt, taskCount, flags, reportText, signedByName, signedAt,
  } = data

  const duration = checkOutAt ? formatDuration(checkInAt, checkOutAt) : '—'
  const visitTime = checkOutAt
    ? `${formatTime(checkInAt)} – ${formatTime(checkOutAt)} (${duration})`
    : formatTime(checkInAt)

  const shortId = reportId.slice(-10).toUpperCase()
  const cdrId = `CDR-${agencyName.replace(/\s/g, '').slice(0, 8).toUpperCase()}-${shortId}`

  const flagsHtml = flags.length > 0
    ? `<div class="flags-section">
        <h3>⚠ FLAGGED CONCERNS</h3>
        <ul>${flags.map((f) => `<li>${f}</li>`).join('')}</ul>
      </div>`
    : ''

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: 'Georgia', serif; color: #1B4332; margin: 0; padding: 40px; font-size: 14px; line-height: 1.6; }
    .header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; }
    .wordmark { font-size: 24px; font-weight: 700; }
    .wordmark span { color: #2D6A4F; }
    .report-id { font-size: 11px; color: #6B7280; font-family: monospace; }
    .divider { border: none; border-top: 2px solid #2D6A4F; margin: 12px 0; }
    .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 4px 16px; margin: 12px 0; }
    .meta-row { display: flex; gap: 8px; font-size: 13px; }
    .meta-label { font-weight: 600; min-width: 90px; color: #374151; }
    .flags-section { background: #FFF7ED; border: 1px solid #FED7AA; border-radius: 6px; padding: 12px 16px; margin: 16px 0; }
    .flags-section h3 { color: #92400E; margin: 0 0 8px; font-size: 14px; }
    .flags-section ul { margin: 0; padding-left: 20px; }
    .flags-section li { color: #92400E; font-size: 13px; margin-bottom: 4px; }
    .report-section h2 { font-size: 13px; font-weight: 700; letter-spacing: 0.05em; text-transform: uppercase; color: #6B7280; margin-bottom: 8px; }
    .report-text { white-space: pre-wrap; font-size: 14px; color: #111827; line-height: 1.7; }
    .signature-section { margin-top: 24px; padding-top: 16px; border-top: 1px solid #E5E7EB; font-size: 12px; color: #6B7280; }
    .signature-section p { margin: 2px 0; }
    .footer { margin-top: 40px; text-align: center; font-size: 11px; color: #9CA3AF; }
  </style>
</head>
<body>
  <div class="header">
    <div class="wordmark">CareDoc<span>AI</span></div>
    <div class="report-id">${cdrId}</div>
  </div>

  <hr class="divider" />

  <div class="meta-grid">
    <div class="meta-row"><span class="meta-label">CLIENT:</span> ${clientName}</div>
    <div class="meta-row"><span class="meta-label">DATE:</span> ${formatDate(checkInAt)}</div>
    <div class="meta-row"><span class="meta-label">CAREGIVER:</span> ${caregiverName}</div>
    <div class="meta-row"><span class="meta-label">VISIT:</span> ${visitTime}</div>
    <div class="meta-row"><span class="meta-label">AGENCY:</span> ${agencyName}</div>
    <div class="meta-row"><span class="meta-label">TASKS:</span> ${taskCount} completed</div>
  </div>

  <hr class="divider" />

  ${flagsHtml}

  <div class="report-section">
    <h2>Visit Report</h2>
    <div class="report-text">${reportText.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>
  </div>

  <hr class="divider" />

  <div class="signature-section">
    <p><strong>DIGITAL SIGNATURE</strong></p>
    <p>Signed by: ${signedByName} on ${formatDate(signedAt)} at ${formatTime(signedAt)}</p>
    <p>Report ID: ${cdrId}</p>
    <p style="margin-top: 8px; font-style: italic;">
      This report was generated with AI assistance and reviewed and approved by the caregiver named above.
    </p>
  </div>

  <div class="footer">
    CareDoc AI — CQC-compliant documentation platform
  </div>
</body>
</html>`
}
