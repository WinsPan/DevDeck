import { useMemo, useState } from 'react'
import { Check, Copy, Plus, Trash2 } from 'lucide-react'

interface HeaderRow { id: number; name: string; value: string }

function shellQuote(value: string) {
  if (!value) return "''"
  return `'${value.replace(/'/g, `'"'"'`)}'`
}

function PowerShellQuote(value: string) {
  return `'${value.replace(/'/g, "''")}'`
}

function CopyCommand({ value }: { value: string }) {
  const [copied, setCopied] = useState(false)
  return <button className="tool-button primary" type="button" onClick={async () => { await navigator.clipboard.writeText(value); setCopied(true); window.setTimeout(() => setCopied(false), 1400) }}>{copied ? <Check size={15} /> : <Copy size={15} />}{copied ? '已复制' : '复制命令'}</button>
}

export default function CurlWorkbench() {
  const [method, setMethod] = useState('GET')
  const [url, setUrl] = useState('https://api.example.com/v1/users')
  const [headers, setHeaders] = useState<HeaderRow[]>([{ id: 1, name: 'Accept', value: 'application/json' }])
  const [auth, setAuth] = useState<'none' | 'bearer' | 'basic'>('none')
  const [credential, setCredential] = useState('')
  const [bodyMode, setBodyMode] = useState<'none' | 'json' | 'raw'>('none')
  const [body, setBody] = useState('{\n  "name": "DevDeck"\n}')
  const [follow, setFollow] = useState(true)
  const [verbose, setVerbose] = useState(false)
  const [shell, setShell] = useState<'posix' | 'powershell'>('posix')

  const command = useMemo(() => {
    const quote = shell === 'posix' ? shellQuote : PowerShellQuote
    const lines = ['curl']
    if (method !== 'GET') lines.push(`--request ${method}`)
    if (follow) lines.push('--location')
    if (verbose) lines.push('--verbose')
    headers.filter((header) => header.name.trim()).forEach((header) => lines.push(`--header ${quote(`${header.name}: ${header.value}`)}`))
    if (auth === 'bearer' && credential) lines.push(`--header ${quote(`Authorization: Bearer ${credential}`)}`)
    if (auth === 'basic' && credential) lines.push(`--user ${quote(credential)}`)
    if (bodyMode === 'json') {
      if (!headers.some((header) => header.name.toLowerCase() === 'content-type')) lines.push(`--header ${quote('Content-Type: application/json')}`)
      lines.push(`--data-raw ${quote(body)}`)
    } else if (bodyMode === 'raw') lines.push(`--data-raw ${quote(body)}`)
    lines.push(quote(url))
    const continuation = shell === 'posix' ? ' \\\n  ' : ' `\n  '
    return lines.join(continuation)
  }, [method, url, headers, auth, credential, bodyMode, body, follow, verbose, shell])

  const addHeader = () => setHeaders((items) => [...items, { id: Date.now(), name: '', value: '' }])
  const updateHeader = (id: number, field: 'name' | 'value', value: string) => setHeaders((items) => items.map((item) => item.id === id ? { ...item, [field]: value } : item))

  return <div className="curl-workbench">
    <div className="curl-request-line"><select value={method} onChange={(event) => setMethod(event.target.value)}>{['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'].map((item) => <option key={item}>{item}</option>)}</select><input value={url} onChange={(event) => setUrl(event.target.value)} placeholder="https://api.example.com/resource" spellCheck={false} /></div>
    <div className="curl-layout"><div className="curl-form">
      <section><div className="curl-section-heading"><strong>请求头</strong><button type="button" onClick={addHeader}><Plus size={14} />添加</button></div><div className="header-rows">{headers.map((header) => <div key={header.id}><input value={header.name} onChange={(event) => updateHeader(header.id, 'name', event.target.value)} placeholder="Header" /><input value={header.value} onChange={(event) => updateHeader(header.id, 'value', event.target.value)} placeholder="Value" /><button type="button" onClick={() => setHeaders((items) => items.filter((item) => item.id !== header.id))} aria-label="删除请求头"><Trash2 size={14} /></button></div>)}</div></section>
      <section><div className="curl-section-heading"><strong>认证</strong></div><div className="curl-inline"><select value={auth} onChange={(event) => setAuth(event.target.value as typeof auth)}><option value="none">无认证</option><option value="bearer">Bearer Token</option><option value="basic">Basic 用户名:密码</option></select>{auth !== 'none' && <input type="password" value={credential} onChange={(event) => setCredential(event.target.value)} placeholder={auth === 'bearer' ? 'Token 不会保存' : 'username:password'} />}</div></section>
      <section><div className="curl-section-heading"><strong>请求体</strong></div><div className="segmented-control"><button type="button" className={bodyMode === 'none' ? 'active' : ''} onClick={() => setBodyMode('none')}>无</button><button type="button" className={bodyMode === 'json' ? 'active' : ''} onClick={() => setBodyMode('json')}>JSON</button><button type="button" className={bodyMode === 'raw' ? 'active' : ''} onClick={() => setBodyMode('raw')}>Raw</button></div>{bodyMode !== 'none' && <textarea value={body} onChange={(event) => setBody(event.target.value)} spellCheck={false} />}</section>
      <section className="curl-options"><label className="check-option"><input type="checkbox" checked={follow} onChange={(event) => setFollow(event.target.checked)} />跟随重定向</label><label className="check-option"><input type="checkbox" checked={verbose} onChange={(event) => setVerbose(event.target.checked)} />详细输出</label></section>
    </div><div className="curl-output"><div className="curl-output-heading"><div className="segmented-control"><button type="button" className={shell === 'posix' ? 'active' : ''} onClick={() => setShell('posix')}>Bash / zsh</button><button type="button" className={shell === 'powershell' ? 'active' : ''} onClick={() => setShell('powershell')}>PowerShell</button></div><CopyCommand value={command} /></div><pre>{command}</pre><div className="curl-security">命令仅在本地生成，不会执行请求。生产 Token 不应出现在终端历史或公开日志中。</div></div></div>
  </div>
}
