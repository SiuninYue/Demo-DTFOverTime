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
    throw new Error('文件下载仅支持在浏览器环境中使用。')
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
    throw new Error('CSV 导出仅支持在浏览器环境中使用。')
  }

  const rows: Array<Array<string | number>> = [
    ['月份', data.monthLabel],
    ['员工', data.employeeName],
    ['已记录天数', `${data.recordedDays}/${data.totalWorkingDays}`],
    ['病假天数', data.mcDays],
    ['发薪倒计时', data.countdownLabel],
    [],
    ['项目', '金额（SGD）'],
    ['底薪', data.result.baseSalary.toFixed(2)],
    ['全勤奖', data.result.attendanceBonus.toFixed(2)],
    ['休息日工资', data.result.restDayPay.toFixed(2)],
    ['公假工资', data.result.publicHolidayPay.toFixed(2)],
    ['加班工资', data.result.overtimePay.toFixed(2)],
    ['扣款', (-Math.abs(data.result.deductions)).toFixed(2)],
    ['应发合计', data.result.totalGross.toFixed(2)],
    ['实发净额', data.result.netPay.toFixed(2)],
    [],
    ['日期', '日期类型', '工时', '底薪', '加班', '合计'],
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
    <h2 style="margin-bottom: 0.25rem;">${data.monthLabel} 工资汇总</h2>
    <p style="margin-top: 0; color: #475569;">${data.employeeName} · ${data.countdownLabel}</p>
    <section style="margin-top: 1rem;">
      <table style="width: 100%; border-collapse: collapse;">
        <tbody>
          <tr>
            <td style="padding: 0.35rem; border: 1px solid #e2e8f0;">底薪</td>
            <td style="padding: 0.35rem; border: 1px solid #e2e8f0; text-align: right;">${formatCurrency(
              data.result.baseSalary,
            )}</td>
          </tr>
          <tr>
            <td style="padding: 0.35rem; border: 1px solid #e2e8f0;">全勤奖</td>
            <td style="padding: 0.35rem; border: 1px solid #e2e8f0; text-align: right;">${formatCurrency(
              data.result.attendanceBonus,
            )}</td>
          </tr>
          <tr>
            <td style="padding: 0.35rem; border: 1px solid #e2e8f0;">休息日工资</td>
            <td style="padding: 0.35rem; border: 1px solid #e2e8f0; text-align: right;">${formatCurrency(
              data.result.restDayPay,
            )}</td>
          </tr>
          <tr>
            <td style="padding: 0.35rem; border: 1px solid #e2e8f0;">公假工资</td>
            <td style="padding: 0.35rem; border: 1px solid #e2e8f0; text-align: right;">${formatCurrency(
              data.result.publicHolidayPay,
            )}</td>
          </tr>
          <tr>
            <td style="padding: 0.35rem; border: 1px solid #e2e8f0;">加班工资</td>
            <td style="padding: 0.35rem; border: 1px solid #e2e8f0; text-align: right;">${formatCurrency(
              data.result.overtimePay,
            )}</td>
          </tr>
          <tr>
            <td style="padding: 0.35rem; border: 1px solid #e2e8f0;">扣款</td>
            <td style="padding: 0.35rem; border: 1px solid #e2e8f0; text-align: right;">${formatCurrency(
              -Math.abs(data.result.deductions),
            )}</td>
          </tr>
          <tr>
            <td style="padding: 0.35rem; border: 1px solid #e2e8f0; font-weight: 600;">应发合计</td>
            <td style="padding: 0.35rem; border: 1px solid #e2e8f0; text-align: right; font-weight: 600;">${formatCurrency(
              data.result.totalGross,
            )}</td>
          </tr>
          <tr>
            <td style="padding: 0.35rem; border: 1px solid #e2e8f0; font-weight: 700;">实发净额</td>
            <td style="padding: 0.35rem; border: 1px solid #e2e8f0; text-align: right; font-weight: 700;">${formatCurrency(
              data.result.netPay,
            )}</td>
          </tr>
        </tbody>
      </table>
    </section>
    <section style="margin-top: 1.5rem;">
      <h3 style="margin-bottom: 0.5rem;">每日明细</h3>
      <table style="width: 100%; border-collapse: collapse; font-size: 0.9rem;">
        <thead>
          <tr>
            <th style="text-align: left; padding: 0.35rem; border-bottom: 2px solid #94a3b8;">日期</th>
            <th style="text-align: left; padding: 0.35rem; border-bottom: 2px solid #94a3b8;">类型</th>
            <th style="text-align: right; padding: 0.35rem; border-bottom: 2px solid #94a3b8;">工时</th>
            <th style="text-align: right; padding: 0.35rem; border-bottom: 2px solid #94a3b8;">底薪</th>
            <th style="text-align: right; padding: 0.35rem; border-bottom: 2px solid #94a3b8;">加班</th>
            <th style="text-align: right; padding: 0.35rem; border-bottom: 2px solid #94a3b8;">合计</th>
          </tr>
        </thead>
        <tbody>
          ${breakdownRows || '<tr><td colspan="6" style="padding: 0.5rem; color: #94a3b8;">暂无打卡明细。</td></tr>'}
        </tbody>
      </table>
    </section>
  `
}

export const exportSalaryPdf = (data: SalaryExportData): void => {
  if (typeof window === 'undefined') {
    throw new Error('PDF 导出仅支持在浏览器环境中使用。')
  }

  const popup = window.open('', '_blank', 'noopener,noreferrer,width=900,height=700')
  if (!popup) {
    throw new Error('请允许弹窗，以便导出工资汇总 PDF。')
  }

  popup.document.write(`
    <!doctype html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>${data.monthLabel} - 工资汇总</title>
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
