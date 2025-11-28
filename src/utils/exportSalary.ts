import type { SalaryResult } from '@/types/salary'
import { formatCurrency } from '@/utils/formatting'

export interface SalaryExportData {
  month: string
  monthLabel: string
  employeeName: string
  recordedDays: number
  totalWorkingDays: number
  mcDays: number
  countdownLabel: string
  result: SalaryResult
}

const sanitizeFilename = (value: string): string =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

const toCsvValue = (value: string | number): string => {
  const text = String(value ?? '')
  if (text.includes(',') || text.includes('"') || /[\n\r]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`
  }
  return text
}

const downloadBlob = (content: string, filename: string, mime: string) => {
  if (typeof document === 'undefined') {
    throw new Error('File downloads are only available in the browser environment.')
  }
  const blob = new Blob([content], { type: mime })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.style.display = 'none'
  document.body.append(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(url)
}

export const exportSalaryCsv = (data: SalaryExportData): void => {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    throw new Error('CSV export is only available in the browser environment.')
  }

  const rows: Array<Array<string | number>> = [
    ['Month', data.monthLabel],
    ['Employee', data.employeeName],
    ['Recorded Days', `${data.recordedDays}/${data.totalWorkingDays}`],
    ['Medical Leave Days', data.mcDays],
    ['Payday Countdown', data.countdownLabel],
    [],
    ['Component', 'Amount (SGD)'],
    ['Base Salary', data.result.baseSalary.toFixed(2)],
    ['Attendance Bonus', data.result.attendanceBonus.toFixed(2)],
    ['Rest Day Pay', data.result.restDayPay.toFixed(2)],
    ['Public Holiday Pay', data.result.publicHolidayPay.toFixed(2)],
    ['Overtime Pay', data.result.overtimePay.toFixed(2)],
    ['Deductions', (-Math.abs(data.result.deductions)).toFixed(2)],
    ['Total Gross', data.result.totalGross.toFixed(2)],
    ['Net Pay', data.result.netPay.toFixed(2)],
    [],
    ['Date', 'Day Type', 'Hours Worked', 'Base Pay', 'Overtime Pay', 'Total'],
  ]

  data.result.breakdown.forEach((entry) => {
    rows.push([
      entry.date,
      entry.dayType,
      entry.hoursWorked.toFixed(2),
      entry.pay.basePay.toFixed(2),
      entry.pay.overtimePay.toFixed(2),
      entry.pay.totalPay.toFixed(2),
    ])
  })

  const csv = rows.map((row) => row.map(toCsvValue).join(',')).join('\n')
  const filename = `salary-${sanitizeFilename(data.month)}.csv`
  downloadBlob(csv, filename, 'text/csv;charset=utf-8;')
}

const buildPrintableTable = (data: SalaryExportData): string => {
  const breakdownRows = data.result.breakdown
    .map(
      (entry) => `
        <tr>
          <td>${entry.date}</td>
          <td>${entry.dayType}</td>
          <td>${entry.hoursWorked.toFixed(2)}</td>
          <td>${formatCurrency(entry.pay.basePay)}</td>
          <td>${formatCurrency(entry.pay.overtimePay)}</td>
          <td>${formatCurrency(entry.pay.totalPay)}</td>
        </tr>
      `,
    )
    .join('\n')

  return `
    <h2 style="margin-bottom: 0.25rem;">${data.monthLabel} Salary Summary</h2>
    <p style="margin-top: 0; color: #475569;">${data.employeeName} · ${data.countdownLabel}</p>
    <section style="margin-top: 1rem;">
      <table style="width: 100%; border-collapse: collapse;">
        <tbody>
          <tr>
            <td style="padding: 0.35rem; border: 1px solid #e2e8f0;">Base Salary</td>
            <td style="padding: 0.35rem; border: 1px solid #e2e8f0; text-align: right;">${formatCurrency(
              data.result.baseSalary,
            )}</td>
          </tr>
          <tr>
            <td style="padding: 0.35rem; border: 1px solid #e2e8f0;">Attendance Bonus</td>
            <td style="padding: 0.35rem; border: 1px solid #e2e8f0; text-align: right;">${formatCurrency(
              data.result.attendanceBonus,
            )}</td>
          </tr>
          <tr>
            <td style="padding: 0.35rem; border: 1px solid #e2e8f0;">Rest Day Pay</td>
            <td style="padding: 0.35rem; border: 1px solid #e2e8f0; text-align: right;">${formatCurrency(
              data.result.restDayPay,
            )}</td>
          </tr>
          <tr>
            <td style="padding: 0.35rem; border: 1px solid #e2e8f0;">Public Holiday Pay</td>
            <td style="padding: 0.35rem; border: 1px solid #e2e8f0; text-align: right;">${formatCurrency(
              data.result.publicHolidayPay,
            )}</td>
          </tr>
          <tr>
            <td style="padding: 0.35rem; border: 1px solid #e2e8f0;">Overtime Pay</td>
            <td style="padding: 0.35rem; border: 1px solid #e2e8f0; text-align: right;">${formatCurrency(
              data.result.overtimePay,
            )}</td>
          </tr>
          <tr>
            <td style="padding: 0.35rem; border: 1px solid #e2e8f0;">Deductions</td>
            <td style="padding: 0.35rem; border: 1px solid #e2e8f0; text-align: right;">${formatCurrency(
              -Math.abs(data.result.deductions),
            )}</td>
          </tr>
          <tr>
            <td style="padding: 0.35rem; border: 1px solid #e2e8f0; font-weight: 600;">Total Gross</td>
            <td style="padding: 0.35rem; border: 1px solid #e2e8f0; text-align: right; font-weight: 600;">${formatCurrency(
              data.result.totalGross,
            )}</td>
          </tr>
          <tr>
            <td style="padding: 0.35rem; border: 1px solid #e2e8f0; font-weight: 700;">Net Pay</td>
            <td style="padding: 0.35rem; border: 1px solid #e2e8f0; text-align: right; font-weight: 700;">${formatCurrency(
              data.result.netPay,
            )}</td>
          </tr>
        </tbody>
      </table>
    </section>
    <section style="margin-top: 1.5rem;">
      <h3 style="margin-bottom: 0.5rem;">Daily Breakdown</h3>
      <table style="width: 100%; border-collapse: collapse; font-size: 0.9rem;">
        <thead>
          <tr>
            <th style="text-align: left; padding: 0.35rem; border-bottom: 2px solid #94a3b8;">Date</th>
            <th style="text-align: left; padding: 0.35rem; border-bottom: 2px solid #94a3b8;">Type</th>
            <th style="text-align: right; padding: 0.35rem; border-bottom: 2px solid #94a3b8;">Hours</th>
            <th style="text-align: right; padding: 0.35rem; border-bottom: 2px solid #94a3b8;">Base</th>
            <th style="text-align: right; padding: 0.35rem; border-bottom: 2px solid #94a3b8;">OT</th>
            <th style="text-align: right; padding: 0.35rem; border-bottom: 2px solid #94a3b8;">Total</th>
          </tr>
        </thead>
        <tbody>
          ${breakdownRows || '<tr><td colspan="6" style="padding: 0.5rem; color: #94a3b8;">No timecard data recorded yet.</td></tr>'}
        </tbody>
      </table>
    </section>
  `
}

export const exportSalaryPdf = (data: SalaryExportData): void => {
  if (typeof window === 'undefined') {
    throw new Error('PDF export is only supported in the browser environment.')
  }

  const popup = window.open('', '_blank', 'noopener,noreferrer,width=900,height=700')
  if (!popup) {
    throw new Error('Please enable popups to export the salary summary as PDF.')
  }

  popup.document.write(`
    <!doctype html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>${data.monthLabel} - Salary Summary</title>
        <style>
          body { font-family: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; margin: 1.5rem; color: #0f172a; }
          h1, h2, h3 { margin: 0; }
          table { width: 100%; }
        </style>
      </head>
      <body>
        ${buildPrintableTable(data)}
      </body>
    </html>
  `)
  popup.document.close()
  popup.focus()
  popup.setTimeout(() => popup.print(), 300)
}
