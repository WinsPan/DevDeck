import { useMemo, useState } from 'react'
import { Check, Copy, Download, RefreshCw, Trash2 } from 'lucide-react'
import {
  base64Decode,
  base64Encode,
  cleanTrackingUrl,
  decodeJwt,
  digestText,
  formatJson,
  hexDecode,
  hexEncode,
  minifyJson,
  randomSecret,
  textStats,
  uuidV4,
  type ToolKind,
} from './toolLogic'

function ToolButton({ children, onClick, primary = false, disabled = false }: { children: React.ReactNode; onClick: () => void; primary?: boolean; disabled?: boolean }) {
  return <button className={primary ? 'tool-button primary' : 'tool-button'} type="button" onClick={onClick} disabled={disabled}>{children}</button>
}

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false)
  const copy = async () => {
    await navigator.clipboard.writeText(value)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1600)
  }
  return <ToolButton onClick={copy} disabled={!value}>{copied ? <><Check size={16} />已复制</> : <><Copy size={16} />复制</>}</ToolButton>
}

function ErrorMessage({ error }: { error: string }) {
  return error ? <div className="tool-error" role="alert">{error}</div> : null
}

export function JsonTool() {
  const sample = '{"name":"DevDeck","private":true,"features":["tools","commands","images"]}'
  const [input, setInput] = useState(sample)
  const [output, setOutput] = useState(() => formatJson(sample))
  const [error, setError] = useState('')
  const run = (mode: 'format' | 'minify') => {
    try { setOutput(mode === 'format' ? formatJson(input) : minifyJson(input)); setError('') }
    catch (caught) { setError(caught instanceof Error ? caught.message : 'JSON 解析失败') }
  }

  return <Workspace input={input} setInput={setInput} output={output} inputLabel="输入 JSON" outputLabel="处理结果" error={error} actions={<><ToolButton primary onClick={() => run('format')}>格式化</ToolButton><ToolButton onClick={() => run('minify')}>压缩</ToolButton><CopyButton value={output} /><ToolButton onClick={() => { setInput(''); setOutput(''); setError('') }}><Trash2 size={16} />清空</ToolButton></>} />
}

export function EncoderTool() {
  const [input, setInput] = useState('Hello, DevDeck 你好！')
  const [output, setOutput] = useState('')
  const [mode, setMode] = useState<'base64' | 'url' | 'hex'>('base64')
  const [error, setError] = useState('')
  const run = (direction: 'encode' | 'decode') => {
    try {
      const result = mode === 'base64' ? (direction === 'encode' ? base64Encode(input) : base64Decode(input)) : mode === 'url' ? (direction === 'encode' ? encodeURIComponent(input) : decodeURIComponent(input)) : (direction === 'encode' ? hexEncode(input) : hexDecode(input))
      setOutput(result); setError('')
    } catch (caught) { setError(caught instanceof Error ? caught.message : '转换失败') }
  }
  return <>
    <div className="segmented-control" role="tablist">{(['base64', 'url', 'hex'] as const).map((item) => <button key={item} className={mode === item ? 'active' : ''} onClick={() => setMode(item)} type="button">{item === 'base64' ? 'Base64' : item === 'url' ? 'URL' : 'Hex'}</button>)}</div>
    <Workspace input={input} setInput={setInput} output={output} inputLabel="原始内容" outputLabel="转换结果" error={error} actions={<><ToolButton primary onClick={() => run('encode')}>编码</ToolButton><ToolButton onClick={() => run('decode')}>解码</ToolButton><CopyButton value={output} /></>} />
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
  const [input, setInput] = useState('DevDeck')
  const [algorithm, setAlgorithm] = useState<'SHA-256' | 'SHA-384' | 'SHA-512'>('SHA-256')
  const [output, setOutput] = useState('')
  const calculate = async () => setOutput(await digestText(input, algorithm))
  return <div>
    <div className="tool-settings"><label><span>算法</span><select value={algorithm} onChange={(event) => setAlgorithm(event.target.value as typeof algorithm)}><option>SHA-256</option><option>SHA-384</option><option>SHA-512</option></select></label><ToolButton primary onClick={calculate}>计算摘要</ToolButton></div>
    <Workspace input={input} setInput={setInput} output={output} inputLabel="输入文本" outputLabel={`${algorithm} 摘要`} actions={<CopyButton value={output} />} />
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

function Workspace({ input, setInput, output, inputLabel, outputLabel, actions, error = '' }: { input: string; setInput: (value: string) => void; output: string; inputLabel: string; outputLabel: string; actions: React.ReactNode; error?: string }) {
  const download = () => {
    const link = document.createElement('a')
    link.href = URL.createObjectURL(new Blob([output], { type: 'text/plain;charset=utf-8' }))
    link.download = 'devdeck-output.txt'
    link.click()
    URL.revokeObjectURL(link.href)
  }
  return <div className="tool-workspace">
    <div className="tool-editors">
      <label><span>{inputLabel}</span><textarea value={input} onChange={(event) => setInput(event.target.value)} spellCheck={false} /></label>
      <label><span>{outputLabel}</span><textarea value={output} readOnly spellCheck={false} placeholder="结果会显示在这里" /></label>
    </div>
    <ErrorMessage error={error} />
    <div className="tool-actionbar">{actions}<ToolButton onClick={download} disabled={!output}><Download size={16} />下载</ToolButton></div>
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
  return <UrlTool />
}
