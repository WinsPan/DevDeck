import { useMemo, useState } from 'react'
import { Cron } from 'croner'

const presets = [
  ['每 5 分钟', '*/5 * * * *'],
  ['每小时', '0 * * * *'],
  ['每天 09:00', '0 9 * * *'],
  ['工作日 09:00', '0 9 * * 1-5'],
  ['每周一 10:00', '0 10 * * 1'],
]

const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']

function explain(expression: string) {
  const [minute, hour, day, month, weekday] = expression.trim().split(/\s+/)
  if (!weekday) return ''
  const time = minute !== '*' && hour !== '*' ? `${hour.padStart(2, '0')}:${minute.padStart(2, '0')}` : undefined
  if (expression === '* * * * *') return '每分钟执行'
  if (minute.startsWith('*/') && hour === '*' && day === '*' && month === '*' && weekday === '*') return `每 ${minute.slice(2)} 分钟执行`
  if (minute !== '*' && hour === '*' && day === '*' && month === '*' && weekday === '*') return `每小时的第 ${minute} 分钟执行`
  if (time && day === '*' && month === '*' && weekday === '*') return `每天 ${time} 执行`
  if (time && day === '*' && month === '*' && weekday === '1-5') return `每个工作日 ${time} 执行`
  if (time && day === '*' && month === '*' && /^\d$/.test(weekday)) return `每${weekdays[Number(weekday)]} ${time} 执行`
  return `按照 ${minute} ${hour} ${day} ${month} ${weekday} 调度`
}

export default function CronWorkbench() {
  const [expression, setExpression] = useState('0 9 * * 1-5')
  const [timezone, setTimezone] = useState(Intl.DateTimeFormat().resolvedOptions().timeZone)
  const result = useMemo(() => {
    try {
      if (expression.trim().split(/\s+/).length !== 5) throw new Error('当前工具使用 Unix Crontab 五字段格式')
      const cron = new Cron(expression, { timezone, maxRuns: 20 })
      return { dates: cron.nextRuns(10), error: '' }
    } catch (caught) {
      return { dates: [] as Date[], error: caught instanceof Error ? caught.message : '表达式无效' }
    }
  }, [expression, timezone])

  return <div className="cron-workbench">
    <div className="cron-input-row"><label><span>Cron 表达式</span><input value={expression} onChange={(event) => setExpression(event.target.value)} spellCheck={false} /></label><label><span>时区</span><input value={timezone} onChange={(event) => setTimezone(event.target.value)} /></label></div>
    <div className="cron-presets">{presets.map(([label, value]) => <button type="button" className={expression === value ? 'active' : ''} key={value} onClick={() => setExpression(value)}>{label}</button>)}</div>
    {result.error ? <div className="tool-error">{result.error}</div> : <>
      <div className="cron-explanation"><span>调度说明</span><strong>{explain(expression)}</strong><small>按 {timezone} 计算</small></div>
      <div className="cron-fields">{['分钟', '小时', '日期', '月份', '星期'].map((label, index) => <div key={label}><span>{label}</span><code>{expression.trim().split(/\s+/)[index]}</code></div>)}</div>
      <div className="next-runs"><div className="panel-heading"><span>未来 10 次执行</span></div>{result.dates.map((date, index) => <div key={date.toISOString()}><span>{String(index + 1).padStart(2, '0')}</span><strong>{date.toLocaleString('zh-CN', { timeZone: timezone, hour12: false })}</strong><code>{date.toISOString()}</code></div>)}</div>
    </>}
  </div>
}
