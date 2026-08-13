import { useEffect, useState } from 'react'
import { Bookmark, CalendarCheck, CheckCircle2, ExternalLink, Info, ShieldAlert } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { CodeBlock } from '../components/CodeBlock'
import { getResource, resourceTypeMeta } from '../data/resources'
import { NotFoundPage } from './NotFoundPage'

const riskMeta = {
  safe: { label: '只读或低风险', className: 'safe', description: '仍请确认目标与占位符，再复制执行。' },
  caution: { label: '会修改环境', className: 'caution', description: '先阅读影响范围，并优先执行检查或备份步骤。' },
  danger: { label: '可能删除数据', className: 'danger', description: '执行后可能难以恢复，必须先验证备份。' },
}

export function ResourcePage() {
  const { slug = '' } = useParams()
  const resource = getResource(slug)
  const [saved, setSaved] = useState(() => localStorage.getItem(`devdeck-save-${slug}`) === '1')

  useEffect(() => {
    document.title = resource ? `${resource.title} — DevDeck` : '未找到 — DevDeck'
    return () => { document.title = 'DevDeck — 开发者工作台' }
  }, [resource])

  if (!resource || resource.type === 'tool') return <NotFoundPage />
  const risk = resource.risk ? riskMeta[resource.risk] : undefined

  const toggleSaved = () => {
    const next = !saved
    setSaved(next)
    localStorage.setItem(`devdeck-save-${slug}`, next ? '1' : '0')
  }

  return (
    <div className="detail-page page-container">
      <nav className="breadcrumbs" aria-label="面包屑">
        <Link to="/library">资源库</Link><span>/</span>
        <Link to={`/library/${resource.type}`}>{resourceTypeMeta[resource.type].plural}</Link><span>/</span>
        <span>{resource.title}</span>
      </nav>

      <header className="detail-header">
        <div className="detail-title-block">
          <span className="type-label">{resourceTypeMeta[resource.type].label}</span>
          <h1>{resource.title}</h1>
          {resource.englishTitle && <div className="detail-english">{resource.englishTitle}</div>}
          <p>{resource.description}</p>
          <div className="detail-tags">
            {resource.tags.map((tag) => <span key={tag}>{tag}</span>)}
          </div>
        </div>
        <button className={saved ? 'save-button saved' : 'save-button'} type="button" onClick={toggleSaved}>
          <Bookmark size={17} fill={saved ? 'currentColor' : 'none'} /> {saved ? '已收藏' : '收藏到本机'}
        </button>
      </header>

      {risk && (
        <div className={`risk-notice ${risk.className}`}>
          <ShieldAlert size={20} />
          <div><strong>{risk.label}</strong><span>{risk.description}</span></div>
        </div>
      )}

      <div className="detail-layout">
        <article className="detail-content">
          {resource.sections.map((section, index) => (
            <section key={`${section.title}-${index}`} id={`section-${index}`} className="content-section">
              <h2>{section.title}</h2>
              {section.body && <p>{section.body}</p>}
              {section.bullets && <ul>{section.bullets.map((bullet) => <li key={bullet}>{bullet}</li>)}</ul>}
              {section.code && <CodeBlock variants={section.code} />}
            </section>
          ))}
        </article>

        <aside className="detail-sidebar">
          <div className="sidebar-card toc-card">
            <strong>本页内容</strong>
            {resource.sections.map((section, index) => <a key={section.title} href={`#section-${index}`}>{section.title}</a>)}
          </div>
          <div className="sidebar-card facts-card">
            <div><CalendarCheck size={16} /><span><small>最近验证</small>{resource.verified}</span></div>
            <div><CheckCircle2 size={16} /><span><small>适用环境</small>{resource.platforms.join(' · ')}</span></div>
            {resource.version && <div><Info size={16} /><span><small>版本</small>{resource.version}</span></div>}
            {resource.source && <a href={resource.source} target="_blank" rel="noreferrer"><ExternalLink size={16} /><span><small>主要来源</small>{resource.sourceLabel ?? '官方文档'}</span></a>}
          </div>
        </aside>
      </div>
    </div>
  )
}
