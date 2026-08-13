import { useEffect, useMemo, useRef, useState } from 'react'
import { Check, ClipboardPaste, Copy, Download, RefreshCw, Trash2 } from 'lucide-react'
import {
  analyzeJson,
  base64Decode,
  base64Encode,
  cleanTrackingUrl,
  decodeJwt,
  digestText,
  hexDecode,
  hexEncode,
  randomSecret,
  textStats,
  uuidV4,
  type ToolKind,
} from './toolLogic'

function ToolButton({ children, onClick, primary = false, disabled = false }: { children: React.ReactNode; onClick: () => void; primary?: boolean; disabled?: boolean }) {
  return <button className={primary ? 'tool-button primary' : 'tool-button'} type="button" onClick={onClick} disabled={disabled}>{children}</button>
}

function CopyButton({ value, compact = false }: { value: string; compact?: boolean }) {
  const [copied, setCopied] = useState(false)
  const copy = async () => {
    await navigator.clipboard.writeText(value)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1600)
  }
  return <ToolButton onClick={copy} disabled={!value}>{copied ? <><Check size={16} />{compact ? '已复制' : '已复制'}</> : <><Copy size={16} />{compact ? '复制' : '复制'}</>}</ToolButton>
}

function ErrorMessage({ error }: { error: string }) {
  return error ? <div className="tool-error" role="alert">{error}</div> : null
}

function useClipboardInput(setValue: (value: string) => void) {
  const [error, setError] = useState('')
  const paste = async () => {
    try {
      setValue(await navigator.clipboard.readText())
      setError('')
    } catch {
      setError('浏览器未允许读取剪贴板，请直接粘贴到输入框。')
    }
  }
  return { paste, error }
}

export function JsonTool() {
  const [input, setInput] = useState('')
  const [indent, setIndent] = useState<2 | 4>(2)
  const [sortKeys, setSortKeys] = useState(false)
  const [compact, setCompact] = useState(false)
  const [clipboardError, setClipboardError] = useState('')
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const analysis = useMemo(() => analyzeJson(input, { indent, sortKeys, compact }), [input, indent, sortKeys, compact])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === 'Enter' && analysis.valid) {
        event.preventDefault()
        void navigator.clipboard.writeText(analysis.output)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [analysis])

  const readClipboard = async () => {
    try {
      const value = await navigator.clipboard.readText()
      setInput(value)
      setClipboardError('')
      inputRef.current?.focus()
    } catch {
      setClipboardError('浏览器未允许读取剪贴板，请直接粘贴到输入框。')
    }
  }

  const loadSample = () => setInput('{"name":"DevDeck","private":true,"features":["tools","commands","images"],"settings":{"theme":"system","locale":"zh-CN"}}')

  return <div className="json-workbench">
    <div className="smart-toolbar">
      <div className="format-options">
        <label><span>输出</span><select value={compact ? 'compact' : indent} onChange={(event) => {
          if (event.target.value === 'compact') setCompact(true)
          else { setCompact(false); setIndent(Number(event.target.value) as 2 | 4) }
        }}><option value="2">2 空格</option><option value="4">4 空格</option><option value="compact">压缩</option></select></label>
        <label className="check-option"><input type="checkbox" checked={sortKeys} onChange={(event) => setSortKeys(event.target.checked)} /><span>递归排序字段</span></label>
      </div>
      <div className="smart-actions">
        <ToolButton onClick={() => void readClipboard()}><ClipboardPaste size={16} />读取剪贴板</ToolButton>
        <ToolButton onClick={loadSample}>载入示例</ToolButton>
      </div>
    </div>

    <div className="instant-status" aria-live="polite">
      {!input.trim() && <span className="idle">粘贴 JSON 后立即格式化，无需点击按钮</span>}
      {input.trim() && analysis.valid && <span className="valid"><Check size={15} />有效 JSON · {analysis.rootType === 'array' ? '数组' : analysis.rootType === 'object' ? '对象' : analysis.rootType}{analysis.itemCount !== undefined ? ` · ${analysis.itemCount} 项` : ''} · {analysis.bytes} B</span>}
      {input.trim() && !analysis.valid && <span className="invalid">格式错误{analysis.line ? ` · 第 ${analysis.line} 行${analysis.column ? `，第 ${analysis.column} 列` : ''}` : ''}</span>}
    </div>

    <div className="smart-editors">
      <div className="smart-editor-pane">
        <div className="editor-heading"><span>输入</span><button type="button" onClick={() => setInput('')} disabled={!input}><Trash2 size={14} />清空</button></div>
        <textarea ref={inputRef} autoFocus value={input} onChange={(event) => setInput(event.target.value)} placeholder={'在这里粘贴 JSON…\n\n也可以点击“读取剪贴板”'} spellCheck={false} aria-label="输入 JSON" />
        {input.trim() && !analysis.valid && <div className="inline-parse-error"><strong>无法解析</strong><span>{analysis.error}</span></div>}
      </div>
      <div className="smart-editor-pane output-pane">
        <div className="editor-heading"><span>格式化结果</span><CopyButton value={analysis.output} compact /></div>
        <textarea value={analysis.output} readOnly placeholder="有效 JSON 的结果会立即显示" spellCheck={false} aria-label="格式化结果" />
        {analysis.valid && <div className="keyboard-hint">⌘/Ctrl + Enter 快速复制结果</div>}
      </div>
    </div>
    <ErrorMessage error={clipboardError} />
  </div>
}

export function EncoderTool() {
  const [input, setInput] = useState('')
  const [mode, setMode] = useState<'base64' | 'url' | 'hex'>('base64')
  const [direction, setDirection] = useState<'encode' | 'decode'>('encode')
  const clipboard = useClipboardInput(setInput)
  const result = useMemo(() => {
    if (!input) return { output: '', error: '' }
    try {
      const output = mode === 'base64'
        ? direction === 'encode' ? base64Encode(input) : base64Decode(input)
        : mode === 'url'
          ? direction === 'encode' ? encodeURIComponent(input) : decodeURIComponent(input)
          : direction === 'encode' ? hexEncode(input) : hexDecode(input)
      return { output, error: '' }
    } catch (caught) {
      return { output: '', error: caught instanceof Error ? caught.message : '转换失败' }
    }
  }, [input, mode, direction])

  return <>
    <div className="smart-toolbar compact-toolbar">
      <div className="toolbar-groups">
        <div className="segmented-control" role="tablist">{(['base64', 'url', 'hex'] as const).map((item) => <button key={item} className={mode === item ? 'active' : ''} onClick={() => setMode(item)} type="button">{item === 'base64' ? 'Base64' : item === 'url' ? 'URL' : 'Hex'}</button>)}</div>
        <div className="segmented-control" role="tablist"><button className={direction === 'encode' ? 'active' : ''} onClick={() => setDirection('encode')} type="button">编码</button><button className={direction === 'decode' ? 'active' : ''} onClick={() => setDirection('decode')} type="button">解码</button></div>
      </div>
      <ToolButton onClick={() => void clipboard.paste()}><ClipboardPaste size={16} />读取剪贴板</ToolButton>
    </div>
    <Workspace input={input} setInput={setInput} output={result.output} inputLabel="原始内容" outputLabel={`${mode === 'base64' ? 'Base64' : mode === 'url' ? 'URL' : 'Hex'} ${direction === 'encode' ? '编码' : '解码'}结果`} error={result.error || clipboard.error} actions={<CopyButton value={result.output} />} placeholder="粘贴后立即转换" />
  </>
}

export function TimestampTool() {
  const now = Math.floor(Date.now() / 1000).toString()
  const [input, setInput] = useState(now)
  const parsed = useMemo(() => {
    const number = Number(input)
    if (!Number.isFinite(number)) return undefined
    const date = new Date(input.match(/^\d+$/) ? (number > 1e12 ? number : number * 1000) : input)
    return Number.isNaN(date.valueOf()) ? undefined : date
  }, [input])
  const rows = parsed ? [
    ['Unix 秒', Math.floor(parsed.valueOf() / 1000).toString()],
    ['Unix 毫秒', parsed.valueOf().toString()],
    ['ISO 8601', parsed.toISOString()],
    ['UTC', parsed.toUTCString()],
    ['本地时间', parsed.toLocaleString()],
  ] : []
  return <div className="timestamp-tool">
    <label className="single-input"><span>时间戳或日期</span><input value={input} onChange={(event) => setInput(event.target.value)} /></label>
    {!parsed && <ErrorMessage error="无法识别这个时间值" />}
    <div className="timestamp-results">{rows.map(([label, value]) => <div key={label}><span>{label}</span><code>{value}</code><CopyButton value={value} /></div>)}</div>
    <ToolButton onClick={() => setInput(Math.floor(Date.now() / 1000).toString())}><RefreshCw size={16} />使用当前时间</ToolButton>
  </div>
}

export function JwtTool() {
  const [input, setInput] = useState('')
  const parsed = useMemo(() => {
    if (!input.trim()) return { data: undefined, error: '' }
    try { return { data: decodeJwt(input), error: '' } }
    catch (caught) { return { data: undefined, error: caught instanceof Error ? caught.message : 'JWT 解析失败' } }
  }, [input])
  return <div>
    <label className="single-input"><span>JWT Token</span><textarea value={input} onChange={(event) => setInput(event.target.value)} placeholder="粘贴 eyJ..." spellCheck={false} /></label>
    <div className="privacy-inline">🔒 Token 只在当前浏览器中解析，不会发送到服务端。</div>
    <ErrorMessage error={parsed.error} />
    {parsed.data && <div className="jwt-panels">
      <JsonPanel title="Header" value={parsed.data.header} />
      <JsonPanel title="Payload" value={parsed.data.payload} />
    </div>}
    {!input && <div className="tool-placeholder">粘贴 JWT 后将显示 Header、Payload 和时间声明。仅解码不代表签名有效。</div>}
  </div>
}

function JsonPanel({ title, value }: { title: string; value: object }) {
  const text = JSON.stringify(value, null, 2)
  return <div className="json-panel"><div><strong>{title}</strong><CopyButton value={text} /></div><pre>{text}</pre></div>
}

export function GeneratorTool() {
  const [kind, setKind] = useState<'uuid' | 'secret' | 'password'>('uuid')
  const [length, setLength] = useState(32)
  const generate = () => kind === 'uuid' ? uuidV4() : kind === 'password' ? randomSecret(length, 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%^&*_-+=') : randomSecret(length)
  const [results, setResults] = useState<string[]>(() => Array.from({ length: 5 }, () => uuidV4()))
  const refresh = () => setResults(Array.from({ length: 5 }, generate))
  return <div className="generator-tool">
    <div className="tool-settings">
      <label><span>类型</span><select value={kind} onChange={(event) => setKind(event.target.value as typeof kind)}><option value="uuid">UUID v4</option><option value="secret">URL-safe Secret</option><option value="password">强密码</option></select></label>
      {kind !== 'uuid' && <label><span>长度</span><input type="number" min="8" max="128" value={length} onChange={(event) => setLength(Number(event.target.value))} /></label>}
      <ToolButton primary onClick={refresh}><RefreshCw size={16} />重新生成</ToolButton>
    </div>
    <div className="generated-list">{results.map((result, index) => <div key={`${result}-${index}`}><code>{result}</code><CopyButton value={result} /></div>)}</div>
  </div>
}

export function HashTool() {
  const [input, setInput] = useState('')
  const [algorithm, setAlgorithm] = useState<'SHA-256' | 'SHA-384' | 'SHA-512'>('SHA-256')
  const [output, setOutput] = useState('')
  const clipboard = useClipboardInput(setInput)

  useEffect(() => {
    let cancelled = false
    if (!input) { setOutput(''); return }
    const timer = window.setTimeout(() => {
      void digestText(input, algorithm).then((value) => { if (!cancelled) setOutput(value) })
    }, 80)
    return () => { cancelled = true; window.clearTimeout(timer) }
  }, [input, algorithm])

  return <div>
    <div className="smart-toolbar compact-toolbar"><div className="tool-settings inline-settings"><label><span>算法</span><select value={algorithm} onChange={(event) => setAlgorithm(event.target.value as typeof algorithm)}><option>SHA-256</option><option>SHA-384</option><option>SHA-512</option></select></label></div><ToolButton onClick={() => void clipboard.paste()}><ClipboardPaste size={16} />读取剪贴板</ToolButton></div>
    <Workspace input={input} setInput={setInput} output={output} inputLabel="输入文本" outputLabel={`${algorithm} 摘要`} error={clipboard.error} actions={<CopyButton value={output} />} placeholder="输入后自动计算" />
  </div>
}

export function TextTool() {
  const [input, setInput] = useState('apple\nbanana\napple\norange\n')
  const [output, setOutput] = useState(input)
  const stats = textStats(input)
  const lines = () => input.split(/\r?\n/)
  return <div>
    <div className="stat-strip"><div><strong>{stats.characters}</strong><span>字符</span></div><div><strong>{stats.words}</strong><span>单词</span></div><div><strong>{stats.lines}</strong><span>行</span></div><div><strong>{stats.bytes}</strong><span>字节</span></div></div>
    <Workspace input={input} setInput={setInput} output={output} inputLabel="输入文本" outputLabel="处理结果" actions={<><ToolButton primary onClick={() => setOutput(Array.from(new Set(lines())).join('\n'))}>行去重</ToolButton><ToolButton onClick={() => setOutput(lines().filter((line) => line.trim()).sort((a, b) => a.localeCompare(b)).join('\n'))}>排序并清空行</ToolButton><ToolButton onClick={() => setOutput(input.toUpperCase())}>大写</ToolButton><CopyButton value={output} /></>} />
  </div>
}

export function UrlTool() {
  const [input, setInput] = useState('https://example.com/article?id=42&utm_source=newsletter&fbclid=tracking')
  const result = useMemo(() => {
    try { return { data: cleanTrackingUrl(input), error: '' } }
    catch { return { data: undefined, error: input ? '请输入完整且有效的 URL' : '' } }
  }, [input])
  return <div>
    <label className="single-input"><span>URL</span><input value={input} onChange={(event) => setInput(event.target.value)} /></label>
    <ErrorMessage error={result.error} />
    {result.data && <>
      <div className="url-parts"><div><span>协议</span><code>{result.data.url.protocol}</code></div><div><span>主机</span><code>{result.data.url.host}</code></div><div><span>路径</span><code>{result.data.url.pathname}</code></div><div><span>参数</span><code>{Array.from(result.data.url.searchParams).length}</code></div></div>
      <div className="clean-url"><span>清理后的 URL</span><code>{result.data.clean}</code><CopyButton value={result.data.clean} /></div>
      <div className="removed-params">{result.data.removed.length ? `已移除：${result.data.removed.join('、')}` : '没有发现常见跟踪参数'}</div>
    </>}
  </div>
}

interface RegexMatchResult {
  value: string
  index: number
  groups: Record<string, string>
  captures: Array<string | undefined>
}

interface RegexWorkerResult {
  matches: RegexMatchResult[]
  replaced: string
  error: string
}

export function RegexTool() {
  const [pattern, setPattern] = useState('(?<key>[a-zA-Z_]+)=(?<value>[^&\\s]+)')
  const [flags, setFlags] = useState('gi')
  const [input, setInput] = useState('token=abc123&mode=debug\nuser=devdeck&role=admin')
  const [replacement, setReplacement] = useState('$<key> → $<value>')
  const [result, setResult] = useState<RegexWorkerResult>({ matches: [], replaced: '', error: '' })
  const [running, setRunning] = useState(true)

  useEffect(() => {
    const worker = new Worker(new URL('./regex.worker.ts', import.meta.url), { type: 'module' })
    const timer = window.setTimeout(() => {
      setRunning(true)
      worker.postMessage({ pattern, flags, input, replacement })
    }, 80)
    const timeout = window.setTimeout(() => {
      worker.terminate()
      setRunning(false)
      setResult({ matches: [], replaced: '', error: '表达式运行时间过长，已停止计算。请检查是否存在灾难性回溯。' })
    }, 800)
    worker.onmessage = (event: MessageEvent<RegexWorkerResult>) => {
      window.clearTimeout(timeout)
      setRunning(false)
      setResult(event.data)
      worker.terminate()
    }
    return () => {
      window.clearTimeout(timer)
      window.clearTimeout(timeout)
      worker.terminate()
    }
  }, [pattern, flags, input, replacement])

  return <div className="regex-tool">
    <div className="regex-config">
      <label><span>表达式</span><div className="regex-expression"><code>/</code><input value={pattern} onChange={(event) => setPattern(event.target.value)} spellCheck={false} /><code>/</code><input className="flags-input" value={flags} onChange={(event) => setFlags(event.target.value.replace(/[^dgimsuvy]/g, ''))} aria-label="Flags" /></div></label>
      <label><span>替换模板</span><input value={replacement} onChange={(event) => setReplacement(event.target.value)} spellCheck={false} /></label>
    </div>
    <ErrorMessage error={result.error} />
    <div className="regex-layout">
      <label className="regex-text"><span>测试文本</span><textarea value={input} onChange={(event) => setInput(event.target.value)} spellCheck={false} /></label>
      <div className="match-panel"><div className="panel-heading"><span>匹配结果</span><strong>{running ? '计算中…' : `${result.matches.length} 处`}</strong></div>{result.matches.length ? <div className="match-list">{result.matches.map((match, index) => <div key={`${match.index}-${index}`}><span>#{index + 1} · index {match.index}</span><code>{match.value}</code>{Object.keys(match.groups).length > 0 && <small>{Object.entries(match.groups).map(([key, value]) => `${key}: ${value}`).join(' · ')}</small>}</div>)}</div> : <div className="empty-match">{result.error ? '修正表达式后查看结果' : '没有匹配项'}</div>}</div>
    </div>
    <div className="replacement-preview"><div className="panel-heading"><span>替换预览</span><CopyButton value={result.replaced} /></div><pre>{result.replaced}</pre></div>
  </div>
}

export function QueryStringTool() {
  const [input, setInput] = useState('https://example.com/search?q=devdeck&tag=tools&tag=cloudflare&page=1')
  const parsed = useMemo(() => {
    try {
      const query = input.includes('?') ? new URL(input).search.slice(1) : input.replace(/^\?/, '')
      const params = new URLSearchParams(query)
      const rows = Array.from(params.entries())
      const grouped: Record<string, string | string[]> = {}
      for (const [key, value] of rows) {
        const current = grouped[key]
        if (current === undefined) grouped[key] = value
        else if (Array.isArray(current)) current.push(value)
        else grouped[key] = [current, value]
      }
      return { rows, json: JSON.stringify(grouped, null, 2), query: params.toString(), error: '' }
    } catch {
      return { rows: [], json: '', query: '', error: '请输入完整 URL 或查询字符串' }
    }
  }, [input])

  return <div className="query-tool">
    <label className="single-input"><span>URL 或 Query String</span><textarea value={input} onChange={(event) => setInput(event.target.value)} spellCheck={false} /></label>
    <ErrorMessage error={parsed.error} />
    <div className="query-summary"><span>{parsed.rows.length} 个参数</span><CopyButton value={parsed.query} /></div>
    <div className="query-layout">
      <div className="parameter-table"><div className="panel-heading"><span>参数</span></div>{parsed.rows.map(([key, value], index) => <div className="parameter-row" key={`${key}-${index}`}><code>{key || '(空键)'}</code><span>{value || '(空值)'}</span></div>)}</div>
      <div className="json-panel"><div><strong>JSON</strong><CopyButton value={parsed.json} /></div><pre>{parsed.json}</pre></div>
    </div>
  </div>
}

function Workspace({ input, setInput, output, inputLabel, outputLabel, actions, error = '', placeholder = '在这里输入或粘贴内容' }: { input: string; setInput: (value: string) => void; output: string; inputLabel: string; outputLabel: string; actions: React.ReactNode; error?: string; placeholder?: string }) {
  const download = () => {
    const link = document.createElement('a')
    link.href = URL.createObjectURL(new Blob([output], { type: 'text/plain;charset=utf-8' }))
    link.download = 'devdeck-output.txt'
    link.click()
    URL.revokeObjectURL(link.href)
  }
  return <div className="tool-workspace">
    <div className="tool-editors">
      <label><span>{inputLabel}</span><textarea value={input} onChange={(event) => setInput(event.target.value)} placeholder={placeholder} spellCheck={false} /></label>
      <label><span>{outputLabel}</span><textarea value={output} readOnly spellCheck={false} placeholder="结果会立即显示在这里" /></label>
    </div>
    <ErrorMessage error={error} />
    <div className="tool-actionbar">{actions}<ToolButton onClick={download} disabled={!output}><Download size={16} />下载</ToolButton><ToolButton onClick={() => setInput('')} disabled={!input}><Trash2 size={16} />清空</ToolButton></div>
  </div>
}

export function ToolRenderer({ kind }: { kind: ToolKind }) {
  if (kind === 'json') return <JsonTool />
  if (kind === 'encoder') return <EncoderTool />
  if (kind === 'timestamp') return <TimestampTool />
  if (kind === 'jwt') return <JwtTool />
  if (kind === 'generator') return <GeneratorTool />
  if (kind === 'hash') return <HashTool />
  if (kind === 'text') return <TextTool />
  if (kind === 'url') return <UrlTool />
  if (kind === 'regex') return <RegexTool />
  return <QueryStringTool />
}
