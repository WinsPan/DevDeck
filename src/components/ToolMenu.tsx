import { useEffect, useRef, useState } from 'react'
import { Braces, ChevronDown, Clock3, Code2, Fingerprint, KeyRound, Link2, Regex, Rows3, Search, X } from 'lucide-react'
import { Link } from 'react-router-dom'

const directTools = [
  { slug: 'json-workbench', label: 'JSON 格式化', hint: '格式化、校验、压缩', icon: Braces },
  { slug: 'encoder-decoder', label: 'Base64 / URL 编码', hint: '编码与解码', icon: Code2 },
  { slug: 'timestamp-converter', label: '时间戳转换', hint: 'Unix、ISO、本地时间', icon: Clock3 },
  { slug: 'jwt-inspector', label: 'JWT 解析', hint: 'Header、Payload、有效期', icon: KeyRound },
  { slug: 'regex-workbench', label: '正则测试', hint: '匹配、捕获组、替换', icon: Regex },
  { slug: 'query-string-workbench', label: '查询参数', hint: 'Query String 与 JSON', icon: Rows3 },
  { slug: 'hash-calculator', label: 'Hash 计算', hint: 'SHA-256 / 384 / 512', icon: Fingerprint },
  { slug: 'url-inspector', label: 'URL 解析', hint: '结构与跟踪参数', icon: Link2 },
]

export function ToolMenu() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const wrapperRef = useRef<HTMLDivElement>(null)
  const filtered = directTools.filter((tool) => `${tool.label} ${tool.hint}`.toLowerCase().includes(query.toLowerCase()))

  useEffect(() => {
    if (!open) return
    const onPointerDown = (event: PointerEvent) => {
      if (!wrapperRef.current?.contains(event.target as Node)) setOpen(false)
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    window.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  return <div className="tool-menu-wrapper" ref={wrapperRef}>
    <button className={open ? 'tool-menu-trigger active' : 'tool-menu-trigger'} type="button" onClick={() => setOpen((value) => !value)} aria-expanded={open}>
      常用工具 <ChevronDown size={14} />
    </button>
    {open && <div className="tool-menu-popover">
      <div className="tool-menu-search"><Search size={15} /><input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder="查找具体工具…" />{query && <button type="button" onClick={() => setQuery('')} aria-label="清空"><X size={14} /></button>}</div>
      <div className="tool-menu-grid">
        {filtered.map(({ slug, label, hint, icon: Icon }) => <Link key={slug} to={`/tools/${slug}`} onClick={() => setOpen(false)}><span><Icon size={17} /></span><div><strong>{label}</strong><small>{hint}</small></div></Link>)}
      </div>
      {!filtered.length && <div className="tool-menu-empty">没有匹配的工具</div>}
      <Link className="tool-menu-all" to="/library/tool" onClick={() => setOpen(false)}>查看全部在线工具</Link>
    </div>}
  </div>
}
