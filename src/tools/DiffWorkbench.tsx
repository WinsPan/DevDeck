import { useMemo, useState } from 'react'
import { Check, Copy } from 'lucide-react'
import { diffLines } from 'diff'

function CopyAction({ value }: { value: string }) {
  const [copied, setCopied] = useState(false)
  return <button className="tool-button" disabled={!value} type="button" onClick={async () => { await navigator.clipboard.writeText(value); setCopied(true); window.setTimeout(() => setCopied(false), 1400) }}>{copied ? <Check size={15} /> : <Copy size={15} />}{copied ? '已复制' : '复制 Diff'}</button>
}

export default function DiffWorkbench() {
  const [before, setBefore] = useState('server {\n  listen 80;\n  server_name old.example.com;\n  proxy_pass http://app:3000;\n}\n')
  const [after, setAfter] = useState('server {\n  listen 443 ssl;\n  server_name api.example.com;\n  proxy_pass http://app:3000;\n  proxy_read_timeout 60s;\n}\n')
  const [ignoreWhitespace, setIgnoreWhitespace] = useState(false)
  const [view, setView] = useState<'unified' | 'split'>('unified')

  const result = useMemo(() => {
    const normalize = (value: string) => ignoreWhitespace ? value.split('\n').map((line) => line.trim()).join('\n') : value
    const parts = diffLines(normalize(before), normalize(after), { newlineIsToken: true })
    let added = 0
    let removed = 0
    const unified: string[] = ['--- 修改前', '+++ 修改后']
    for (const part of parts) {
      const lines = part.value.replace(/\n$/, '').split('\n')
      if (part.added) { added += lines.length; lines.forEach((line) => unified.push(`+${line}`)) }
      else if (part.removed) { removed += lines.length; lines.forEach((line) => unified.push(`-${line}`)) }
      else lines.forEach((line) => unified.push(` ${line}`))
    }
    return { parts, added, removed, unified: unified.join('\n') }
  }, [before, after, ignoreWhitespace])

  return <div className="diff-workbench">
    <div className="smart-toolbar compact-toolbar">
      <div className="segmented-control"><button type="button" className={view === 'unified' ? 'active' : ''} onClick={() => setView('unified')}>统一视图</button><button type="button" className={view === 'split' ? 'active' : ''} onClick={() => setView('split')}>并排输入</button></div>
      <label className="check-option"><input type="checkbox" checked={ignoreWhitespace} onChange={(event) => setIgnoreWhitespace(event.target.checked)} />忽略行首尾空白</label>
    </div>
    <div className="diff-summary"><span><strong className="added-text">+{result.added}</strong> 新增</span><span><strong className="removed-text">−{result.removed}</strong> 删除</span><span>{result.parts.filter((part) => part.added || part.removed).length} 个变更块</span><CopyAction value={result.unified} /></div>
    <div className="diff-inputs">
      <label><span>修改前</span><textarea value={before} onChange={(event) => setBefore(event.target.value)} spellCheck={false} /></label>
      <label><span>修改后</span><textarea value={after} onChange={(event) => setAfter(event.target.value)} spellCheck={false} /></label>
    </div>
    {view === 'unified' && <div className="unified-diff" aria-label="统一差异视图">{result.parts.map((part, index) => <div key={index} className={part.added ? 'diff-added' : part.removed ? 'diff-removed' : 'diff-same'}>{part.value.replace(/\n$/, '').split('\n').map((line, lineIndex) => <div key={lineIndex}><span>{part.added ? '+' : part.removed ? '−' : ' '}</span><code>{line || ' '}</code></div>)}</div>)}</div>}
  </div>
}
