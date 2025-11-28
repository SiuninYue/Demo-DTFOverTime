interface PHTimecardFormProps {
  normalHours: number
}

function PHTimecardForm({ normalHours }: PHTimecardFormProps) {
  return (
    <section className="ph-card">
      <header>
        <h3>Public Holiday Reminder</h3>
      </header>
      <p className="text-muted">
        工作≤{normalHours}小时 → 额外 1 日薪；超出部分依 1.5× OT 计算并累积到加班统计。
      </p>
    </section>
  )
}

export default PHTimecardForm
