import { useEffect, useMemo, useRef, useState } from 'react'
import { ArrowDown, ArrowUp, CornerDownLeft, Search, X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { searchResources } from '../utils/search'
import { ResourceRow, resourceHref } from './ResourceRow'

const quickQueries = ['端口占用', 'Docker 清理', 'PostgreSQL', '反向代理', 'Git 撤销']

export function SearchDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [query, setQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const navigate = useNavigate()
  const results = useMemo(() => searchResources(query).slice(0, 7), [query])

  useEffect(() => {
    if (!open) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    requestAnimationFrame(() => inputRef.current?.focus())
    return () => { document.body.style.overflow = previousOverflow }
  }, [open])

  useEffect(() => setActiveIndex(0), [query])

  if (!open) return null

  const openResult = (index: number) => {
    const result = results[index]
    if (!result) return
    navigate(resourceHref(result))
    onClose()
    setQuery('')
  }

  return (
    <div className="search-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="search-dialog" role="dialog" aria-modal="true" aria-label="搜索 DevDeck">
        <div className="search-input-row">
          <Search size={21} aria-hidden="true" />
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Escape') onClose()
              if (event.key === 'ArrowDown') {
                event.preventDefault()
                setActiveIndex((current) => Math.min(current + 1, results.length - 1))
              }
              if (event.key === 'ArrowUp') {
                event.preventDefault()
                setActiveIndex((current) => Math.max(current - 1, 0))
              }
              if (event.key === 'Enter') openResult(activeIndex)
            }}
            placeholder="搜索工具、命令、镜像、配置或任务…"
            aria-label="搜索"
          />
          {query && <button className="clear-search" onClick={() => setQuery('')} type="button" aria-label="清除搜索"><X size={17} /></button>}
          <kbd className="esc-key">ESC</kbd>
        </div>

        {!query && (
          <div className="search-empty-state">
            <span className="overline">常用任务</span>
            <div className="quick-searches">
              {quickQueries.map((item) => (
                <button key={item} type="button" onClick={() => setQuery(item)}>{item}</button>
              ))}
            </div>
          </div>
        )}

        {query && (
          <div className="search-results" role="listbox" aria-label="搜索结果">
            {results.length ? results.map((resource, index) => (
              <div
                key={resource.slug}
                className={index === activeIndex ? 'search-result active' : 'search-result'}
                onMouseEnter={() => setActiveIndex(index)}
                onClick={() => openResult(index)}
                role="option"
                aria-selected={index === activeIndex}
              >
                <ResourceRow resource={resource} compact />
              </div>
            )) : (
              <div className="no-results">
                <strong>没有找到“{query}”</strong>
                <span>试试更短的任务描述，或搜索技术名称。</span>
              </div>
            )}
          </div>
        )}

        <div className="search-hints">
          <span><ArrowUp size={13} /><ArrowDown size={13} /> 选择</span>
          <span><CornerDownLeft size={13} /> 打开</span>
          <span>ESC 关闭</span>
        </div>
      </section>
    </div>
  )
}
