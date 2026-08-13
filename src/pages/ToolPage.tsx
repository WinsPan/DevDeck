import { Bookmark, LockKeyhole } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { getResource } from '../data/resources'
import { toolKindFromSlug } from '../tools/toolLogic'
import { ToolRenderer } from '../tools/ToolComponents'
import { NotFoundPage } from './NotFoundPage'

export function ToolPage() {
  const { slug = '' } = useParams()
  const resource = getResource(slug)
  const kind = toolKindFromSlug(slug)
  const [saved, setSaved] = useState(() => localStorage.getItem(`devdeck-save-${slug}`) === '1')

  useEffect(() => {
    document.title = resource ? `${resource.title} — DevDeck` : '未找到 — DevDeck'
    return () => { document.title = 'DevDeck — 开发者工作台' }
  }, [resource])

  if (!resource || !kind) return <NotFoundPage />

  const toggleSaved = () => {
    const next = !saved
    setSaved(next)
    localStorage.setItem(`devdeck-save-${slug}`, next ? '1' : '0')
  }

  return (
    <div className="tool-page page-container">
      <nav className="breadcrumbs"><Link to="/library">资源库</Link><span>/</span><Link to="/library/tool">在线工具</Link><span>/</span><span>{resource.title}</span></nav>
      <header className="tool-page-header">
        <div>
          <span className="type-label">在线工具</span>
          <h1>{resource.title}</h1>
          <p>{resource.description}</p>
        </div>
        <button className={saved ? 'save-button saved' : 'save-button'} type="button" onClick={toggleSaved}><Bookmark size={17} fill={saved ? 'currentColor' : 'none'} />{saved ? '已收藏' : '收藏到本机'}</button>
      </header>
      <div className="local-processing"><LockKeyhole size={17} /><span><strong>本地处理</strong> — 输入与文件不会离开你的浏览器。</span></div>
      <section className="tool-surface">
        <ToolRenderer kind={kind} />
      </section>
      <div className="tool-footnote">处理结果不会自动保存。关闭页面或刷新后，敏感输入将从当前会话中清除。</div>
    </div>
  )
}
