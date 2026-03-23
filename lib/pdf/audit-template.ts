import { formatDate, formatTime, formatDuration } from '@/lib/utils'

interface AuditPackData {
  client: {
    name: string
    dob: Date | null
    address: string
    conditions: string[]
    carePlan: string
  }
  agencyName: string
  dateFrom: Date
  dateTo: Date
  exportDate: Date
  visits: Array<{
    id: string
    checkInAt: Date
    checkOutAt: Date | null
    caregiverName: string
    taskCount: number
    flagCount: number
    status: string
  }>
  reports: Array<{
    id: string
    visitDate: Date
    caregiverName: string
    reportText: string
    flags: string[]
    signedAt: Date | null
    signedByName: string | null
    checkInAt: Date
    checkOutAt: Date | null
    taskCount: number
    rawNotes: {
      care: string
      condition: string
      incident: string
      response: string
    } | null
    includeRawNotes: boolean
  }>
  flags: Array<{
    date: Date
    flag: string
    clientName: string
    caregiverName: string
    reportId: string
  }>
  auditLogs: Array<{
    createdAt: Date
    action: string
    userName: string | null
  }>
  options: {
    includeRawNotes: boolean
    includeFlags: boolean
    includeTasks: boolean
    includeSignatures: boolean
    includeAuditLog: boolean
    anonymiseCaregivers: boolean
    redactedLabel: string
  }
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function durationOrDash(checkInAt: Date, checkOutAt: Date | null): string {
  if (!checkOutAt) return '—'
  return formatDuration(checkInAt, checkOutAt)
}

function statusLabel(status: string): string {
  return status.replace(/_/g, ' ')
}

export function buildAuditPackHtml(data: AuditPackData): string {
  const { client, agencyName, dateFrom, dateTo, exportDate, visits, reports, flags, auditLogs, options } = data

  const exportDateStr = formatDate(exportDate)

  // ── Cover page ──────────────────────────────────────────────────────────────
  const conditionsHtml = client.conditions.length > 0
    ? client.conditions.map((c) => `<span class="tag">${escapeHtml(c)}</span>`).join(' ')
    : '<span class="muted">None recorded</span>'

  const coverPage = `
  <div class="cover-page">
    <div class="confidential-stamp">CONFIDENTIAL</div>
    <div class="cover-wordmark">CareDoc<span>AI</span></div>
    <h1 class="cover-title">Inspection Pack</h1>
    <p class="cover-subtitle">${escapeHtml(agencyName)}</p>

    <div class="cover-grid">
      <div class="cover-field"><span class="cover-label">CLIENT</span><span>${escapeHtml(client.name)}</span></div>
      <div class="cover-field"><span class="cover-label">DATE OF BIRTH</span><span>${client.dob ? formatDate(client.dob) : '—'}</span></div>
      <div class="cover-field"><span class="cover-label">ADDRESS</span><span>${escapeHtml(client.address)}</span></div>
      <div class="cover-field"><span class="cover-label">PERIOD COVERED</span><span>${formatDate(dateFrom)} – ${formatDate(dateTo)}</span></div>
      <div class="cover-field"><span class="cover-label">EXPORT DATE</span><span>${exportDateStr}</span></div>
      <div class="cover-field"><span class="cover-label">VISIT COUNT</span><span>${visits.length}</span></div>
    </div>

    <div class="cover-conditions">
      <div class="cover-label" style="margin-bottom:6px;">CONDITIONS</div>
      ${conditionsHtml}
    </div>

    <div class="care-plan-box">
      <div class="cover-label" style="margin-bottom:6px;">CARE PLAN SUMMARY</div>
      <div class="care-plan-text">${escapeHtml(client.carePlan)}</div>
    </div>

    <div class="cover-footer">
      This document contains confidential personal data. Handle in accordance with your agency's data protection policy.
    </div>
  </div>`

  // ── Visit Summary table ──────────────────────────────────────────────────────
  const visitRows = visits.map((v, i) => {
    const rowClass = i % 2 === 0 ? 'row-even' : 'row-odd'
    const duration = durationOrDash(v.checkInAt, v.checkOutAt)
    const flagBadge = v.flagCount > 0
      ? `<span class="flag-badge">${v.flagCount}</span>`
      : '<span class="muted">0</span>'
    return `<tr class="${rowClass}">
      <td>${formatDate(v.checkInAt)}</td>
      <td>${escapeHtml(v.caregiverName)}</td>
      <td>${formatTime(v.checkInAt)}${v.checkOutAt ? ' – ' + formatTime(v.checkOutAt) : ''} (${duration})</td>
      <td>${v.taskCount}</td>
      <td>${flagBadge}</td>
      <td><span class="status-badge">${statusLabel(v.status)}</span></td>
    </tr>`
  }).join('')

  const visitSummarySection = `
  <div class="page-break">
    <h2 class="section-heading">Visit Summary</h2>
    <table class="data-table">
      <thead>
        <tr>
          <th>Date</th>
          <th>Caregiver</th>
          <th>Duration</th>
          <th>Tasks</th>
          <th>Flags</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        ${visits.length > 0 ? visitRows : '<tr><td colspan="6" class="muted" style="text-align:center;">No visits in this period</td></tr>'}
      </tbody>
    </table>
  </div>`

  // ── Full Visit Reports ────────────────────────────────────────────────────────
  const reportsHtml = reports.map((r) => {
    const visitTime = r.checkOutAt
      ? `${formatTime(r.checkInAt)} – ${formatTime(r.checkOutAt)} (${durationOrDash(r.checkInAt, r.checkOutAt)})`
      : formatTime(r.checkInAt)

    const flagsHtml = r.flags.length > 0
      ? `<div class="flags-box">
          <div class="flags-title">Flagged Concerns</div>
          <ul>${r.flags.map((f) => `<li>${escapeHtml(f)}</li>`).join('')}</ul>
        </div>`
      : ''

    const rawNotesHtml = (r.includeRawNotes && r.rawNotes)
      ? `<div class="raw-notes">
          <div class="raw-notes-title">Raw Notes</div>
          <div class="raw-notes-grid">
            <div><strong>Care</strong><p>${escapeHtml(r.rawNotes.care) || '<em class="muted">None</em>'}</p></div>
            <div><strong>Condition</strong><p>${escapeHtml(r.rawNotes.condition) || '<em class="muted">None</em>'}</p></div>
            <div><strong>Incident</strong><p>${escapeHtml(r.rawNotes.incident) || '<em class="muted">None</em>'}</p></div>
            <div><strong>Response</strong><p>${escapeHtml(r.rawNotes.response) || '<em class="muted">None</em>'}</p></div>
          </div>
        </div>`
      : ''

    const signatureHtml = options.includeSignatures
      ? `<div class="signature-line">
          ${r.signedAt && r.signedByName
            ? `Signed by <strong>${escapeHtml(r.signedByName)}</strong> on ${formatDate(r.signedAt)} at ${formatTime(r.signedAt)}`
            : r.signedAt
              ? `Signed on ${formatDate(r.signedAt)} at ${formatTime(r.signedAt)}`
              : '<em>Not yet signed</em>'
          }
        </div>`
      : ''

    return `<div class="report-block">
      <div class="report-meta-grid">
        <div class="meta-item"><span class="meta-label">Date</span>${formatDate(r.visitDate)}</div>
        <div class="meta-item"><span class="meta-label">Caregiver</span>${escapeHtml(r.caregiverName)}</div>
        <div class="meta-item"><span class="meta-label">Visit Time</span>${visitTime}</div>
        <div class="meta-item"><span class="meta-label">Tasks</span>${r.taskCount} completed</div>
        <div class="meta-item"><span class="meta-label">Report ID</span><code>${r.id.slice(-10).toUpperCase()}</code></div>
      </div>
      ${flagsHtml}
      <div class="report-text-block">${escapeHtml(r.reportText)}</div>
      ${rawNotesHtml}
      ${signatureHtml}
    </div>`
  }).join('')

  const reportsSection = `
  <div class="page-break">
    <h2 class="section-heading">Full Visit Reports</h2>
    ${reports.length > 0 ? reportsHtml : '<p class="muted">No signed reports in this period.</p>'}
  </div>`

  // ── Flagged Concerns ─────────────────────────────────────────────────────────
  const flaggedSection = options.includeFlags ? `
  <div class="page-break">
    <h2 class="section-heading">Flagged Concerns</h2>
    ${flags.length > 0
      ? `<table class="data-table">
          <thead>
            <tr><th>Date</th><th>Caregiver</th><th>Flag</th><th>Report Ref</th></tr>
          </thead>
          <tbody>
            ${flags.map((f, i) => `<tr class="${i % 2 === 0 ? 'row-even' : 'row-odd'}">
              <td>${formatDate(f.date)}</td>
              <td>${escapeHtml(f.caregiverName)}</td>
              <td>${escapeHtml(f.flag)}</td>
              <td><code>${f.reportId.slice(-10).toUpperCase()}</code></td>
            </tr>`).join('')}
          </tbody>
        </table>`
      : '<p class="muted">No flagged concerns in this period.</p>'
    }
  </div>` : ''

  // ── Audit Trail ──────────────────────────────────────────────────────────────
  const auditSection = options.includeAuditLog ? `
  <div class="page-break">
    <h2 class="section-heading">Audit Trail</h2>
    ${auditLogs.length > 0
      ? `<table class="data-table">
          <thead>
            <tr><th>Timestamp</th><th>User</th><th>Action</th></tr>
          </thead>
          <tbody>
            ${auditLogs.map((l, i) => `<tr class="${i % 2 === 0 ? 'row-even' : 'row-odd'}">
              <td>${formatDate(l.createdAt)} ${formatTime(l.createdAt)}</td>
              <td>${escapeHtml(l.userName ?? 'System')}</td>
              <td><code>${escapeHtml(l.action)}</code></td>
            </tr>`).join('')}
          </tbody>
        </table>`
      : '<p class="muted">No audit events in this period.</p>'
    }
  </div>` : ''

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Inspection Pack — ${escapeHtml(client.name)}</title>
  <style>
    @page { margin: 20mm 18mm; }
    * { box-sizing: border-box; }
    body {
      font-family: 'Georgia', serif;
      color: #1B4332;
      margin: 0;
      padding: 40px;
      font-size: 13px;
      line-height: 1.6;
      background: #fff;
    }

    /* Page breaks */
    .page-break { page-break-before: always; padding-top: 32px; }

    /* Cover page */
    .cover-page { position: relative; min-height: 700px; padding-bottom: 48px; }
    .confidential-stamp {
      position: absolute;
      top: 0;
      right: 0;
      background: #B91C1C;
      color: #fff;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.12em;
      padding: 4px 12px;
      border-radius: 3px;
    }
    .cover-wordmark { font-size: 28px; font-weight: 700; margin-bottom: 8px; }
    .cover-wordmark span { color: #2D6A4F; }
    .cover-title { font-size: 36px; font-weight: 700; color: #1B4332; margin: 8px 0 4px; }
    .cover-subtitle { font-size: 16px; color: #4B7A63; margin: 0 0 28px; }
    .cover-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px 24px;
      margin-bottom: 24px;
      border-top: 2px solid #2D6A4F;
      border-bottom: 1px solid #D1FAE5;
      padding: 16px 0;
    }
    .cover-field { display: flex; flex-direction: column; gap: 2px; }
    .cover-label {
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 0.08em;
      color: #6B7280;
      text-transform: uppercase;
    }
    .cover-conditions { margin-bottom: 20px; }
    .tag {
      display: inline-block;
      background: #D1FAE5;
      color: #065F46;
      border-radius: 4px;
      padding: 2px 8px;
      font-size: 12px;
      margin-right: 4px;
      margin-bottom: 4px;
    }
    .care-plan-box {
      background: #F0FDF4;
      border: 1px solid #BBF7D0;
      border-radius: 6px;
      padding: 14px 16px;
      margin-bottom: 20px;
    }
    .care-plan-text { font-size: 13px; color: #111827; white-space: pre-wrap; }
    .cover-footer {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      font-size: 11px;
      color: #9CA3AF;
      border-top: 1px solid #E5E7EB;
      padding-top: 10px;
    }

    /* Section headings */
    .section-heading {
      font-size: 18px;
      font-weight: 700;
      color: #2D6A4F;
      border-bottom: 2px solid #2D6A4F;
      padding-bottom: 6px;
      margin-bottom: 18px;
    }

    /* Tables */
    .data-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 12px;
      margin-bottom: 24px;
    }
    .data-table th {
      background: #2D6A4F;
      color: #fff;
      text-align: left;
      padding: 8px 10px;
      font-size: 11px;
      letter-spacing: 0.05em;
      text-transform: uppercase;
    }
    .data-table td { padding: 7px 10px; border-bottom: 1px solid #E5E7EB; vertical-align: top; }
    .row-even { background: #fff; }
    .row-odd  { background: #F9FAFB; }

    /* Badges */
    .flag-badge {
      display: inline-block;
      background: #FEF3C7;
      color: #92400E;
      border: 1px solid #FCD34D;
      border-radius: 10px;
      padding: 1px 8px;
      font-size: 11px;
      font-weight: 700;
    }
    .status-badge {
      display: inline-block;
      background: #D1FAE5;
      color: #065F46;
      border-radius: 4px;
      padding: 2px 6px;
      font-size: 11px;
      font-weight: 600;
    }

    /* Report blocks */
    .report-block {
      border: 1px solid #D1FAE5;
      border-radius: 8px;
      padding: 18px 20px;
      margin-bottom: 28px;
      page-break-inside: avoid;
    }
    .report-meta-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 4px 16px;
      margin-bottom: 14px;
      padding-bottom: 12px;
      border-bottom: 1px solid #E5E7EB;
      font-size: 12px;
    }
    .meta-item { display: flex; flex-direction: column; gap: 1px; }
    .meta-label {
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 0.06em;
      color: #6B7280;
      text-transform: uppercase;
    }
    .flags-box {
      background: #FFF7ED;
      border: 1px solid #FED7AA;
      border-radius: 6px;
      padding: 10px 14px;
      margin-bottom: 12px;
    }
    .flags-title { font-size: 12px; font-weight: 700; color: #92400E; margin-bottom: 6px; }
    .flags-box ul { margin: 0; padding-left: 18px; }
    .flags-box li { color: #92400E; font-size: 12px; margin-bottom: 3px; }
    .report-text-block {
      white-space: pre-wrap;
      font-size: 13px;
      color: #111827;
      line-height: 1.7;
      margin-bottom: 12px;
    }
    .raw-notes {
      background: #F8FAFC;
      border: 1px solid #E2E8F0;
      border-radius: 6px;
      padding: 12px 14px;
      margin-bottom: 12px;
    }
    .raw-notes-title { font-size: 11px; font-weight: 700; letter-spacing: 0.06em; color: #6B7280; text-transform: uppercase; margin-bottom: 8px; }
    .raw-notes-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px 16px; font-size: 12px; }
    .raw-notes-grid p { margin: 2px 0 0; color: #374151; }
    .signature-line {
      font-size: 11px;
      color: #6B7280;
      border-top: 1px solid #E5E7EB;
      padding-top: 8px;
    }

    /* Misc */
    .muted { color: #9CA3AF; font-style: italic; }
    code { font-family: monospace; font-size: 11px; color: #374151; }

    /* Print footer — fixed at bottom of every printed page */
    .print-footer {
      margin-top: 48px;
      text-align: center;
      font-size: 10px;
      color: #9CA3AF;
      border-top: 1px solid #E5E7EB;
      padding-top: 8px;
    }
    @media print {
      .print-footer {
        position: fixed;
        bottom: 0;
        left: 0;
        right: 0;
        margin: 0;
        padding: 6px 40px;
        background: #fff;
      }
    }
  </style>
</head>
<body>

  ${coverPage}

  ${visitSummarySection}

  ${reportsSection}

  ${flaggedSection}

  ${auditSection}

  <div class="print-footer">
    Exported from CareDoc AI | ${exportDateStr} | CONFIDENTIAL
  </div>

</body>
</html>`
}
