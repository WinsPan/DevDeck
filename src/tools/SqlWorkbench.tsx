import { useMemo, useState } from 'react'
import { Check, Copy, ShieldAlert } from 'lucide-react'
import { format, type SqlLanguage } from 'sql-formatter'

type Dialect = Extract<SqlLanguage, 'sql' | 'postgresql' | 'mysql' | 'sqlite'>

const dialects: Array<[Dialect, string]> = [['sql', 'Standard SQL'], ['postgresql', 'PostgreSQL'], ['mysql', 'MySQL'], ['sqlite', 'SQLite']]

function minifySql(input: string) {
  return input
    .replace(/--[^\n\r]*/g, ' ')
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/\s*([(),;])\s*/g, '$1 ')
    .trim()
}

function analyzeStatements(input: string) {
  const statements = input.split(';').map((statement) => statement.trim()).filter(Boolean)
  const types = statements.map((statement) => statement.match(/^(?:WITH\s+[\s\S]+?\)\s*)?([A-Z]+)/i)?.[1]?.toUpperCase() ?? 'UNKNOWN')
  const params = Array.from(new Set(input.match(/\$\d+|:[a-zA-Z_]\w*|@[a-zA-Z_]\w*|\?/g) ?? []))
  const warnings: string[] = []
  statements.forEach((statement, index) => {
    if (/^(UPDATE|DELETE)\b/i.test(statement) && !/\bWHERE\b/i.test(statement)) warnings.push(`第 ${index + 1} 条 ${types[index]} 语句没有 WHERE 条件`)
    if (/\bDROP\s+(TABLE|DATABASE|SCHEMA)\b/i.test(statement)) warnings.push(`第 ${index + 1} 条语句包含 DROP 操作`)
    if (/\bTRUNCATE\b/i.test(statement)) warnings.push(`第 ${index + 1} 条语句包含 TRUNCATE 操作`)
  })
  return { statements, types, params, warnings }
}

function CopySql({ value }: { value: string }) {
  const [copied, setCopied] = useState(false)
  return <button className="tool-button" disabled={!value} type="button" onClick={async () => { await navigator.clipboard.writeText(value); setCopied(true); window.setTimeout(() => setCopied(false), 1400) }}>{copied ? <Check size={15} /> : <Copy size={15} />}{copied ? '已复制' : '复制结果'}</button>
}

export default function SqlWorkbench() {
  const [input, setInput] = useState("SELECT u.id,u.email,COUNT(o.id) AS orders FROM users u LEFT JOIN orders o ON o.user_id=u.id WHERE u.status='active' GROUP BY u.id,u.email ORDER BY orders DESC;")
  const [dialect, setDialect] = useState<Dialect>('postgresql')
  const [keywordCase, setKeywordCase] = useState<'upper' | 'lower' | 'preserve'>('upper')
  const [compact, setCompact] = useState(false)

  const result = useMemo(() => {
    try {
      const output = compact ? minifySql(input) : format(input, { language: dialect, keywordCase, tabWidth: 2, linesBetweenQueries: 2 })
      return { output, error: '', ...analyzeStatements(input) }
    } catch (caught) {
      return { output: '', error: caught instanceof Error ? caught.message : 'SQL 格式化失败', statements: [], types: [], params: [], warnings: [] }
    }
  }, [input, dialect, keywordCase, compact])

  return <div className="sql-workbench">
    <div className="smart-toolbar compact-toolbar"><div className="toolbar-groups"><label className="compact-select"><span>方言</span><select value={dialect} onChange={(event) => setDialect(event.target.value as Dialect)}>{dialects.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label><label className="compact-select"><span>关键字</span><select value={keywordCase} onChange={(event) => setKeywordCase(event.target.value as typeof keywordCase)}><option value="upper">大写</option><option value="lower">小写</option><option value="preserve">保持</option></select></label><label className="check-option"><input type="checkbox" checked={compact} onChange={(event) => setCompact(event.target.checked)} />压缩输出</label></div><CopySql value={result.output} /></div>
    <div className="sql-metrics"><span>{result.statements.length} 条语句</span><span>{result.params.length} 个参数</span><span>{Array.from(new Set(result.types)).join(' · ') || '等待输入'}</span></div>
    {result.warnings.length > 0 && <div className="sql-warnings"><ShieldAlert size={18} /><div><strong>执行前请确认</strong>{result.warnings.map((warning) => <span key={warning}>{warning}</span>)}</div></div>}
    {result.error && <div className="tool-error">{result.error}</div>}
    <div className="tool-editors sql-editors"><label><span>原始 SQL</span><textarea value={input} onChange={(event) => setInput(event.target.value)} spellCheck={false} /></label><label><span>{compact ? '压缩结果' : '格式化结果'}</span><textarea value={result.output} readOnly spellCheck={false} /></label></div>
    {result.params.length > 0 && <div className="sql-params"><span>检测到的参数</span>{result.params.map((param) => <code key={param}>{param}</code>)}</div>}
    <div className="privacy-inline">仅进行本地静态处理，不会连接数据库，也不会验证表名和字段名。</div>
  </div>
}
