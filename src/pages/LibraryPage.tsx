import { useMemo, useState } from 'react'
import { Filter, Search } from 'lucide-react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { resourceTypeMeta } from '../data/resources'
import type { ResourceType } from '../data/types'
import { searchResources } from '../utils/search'
import { ResourceRow } from '../components/ResourceRow'

const types: Array<'all' | ResourceType> = ['all', 'tool', 'command', 'image', 'template', 'guide']
const validTypes = new Set<ResourceType>(['tool', 'command', 'image', 'template', 'guide'])

export function LibraryPage() {
  const { type: routeType } = useParams()
  const [searchParams, setSearchParams] = useSearchParams()
  const initialType = routeType && validTypes.has(routeType as ResourceType) ? routeType as ResourceType : 'all'
  const [query, setQuery] = useState(searchParams.get('q') ?? '')
  const selectedType = initialType
  const results = useMemo(() => searchResources(query, selectedType), [query, selectedType])

  const typeTitle = selectedType === 'all' ? '全部资源' : resourceTypeMeta[selectedType].plural

  return (
    <div className="page-container library-page">
      <div className="page-heading">
        <span className="overline">LIBRARY</span>
        <h1>{typeTitle}</h1>
        <p>查找经过整理的工具、命令、镜像、配置与分步指南。</p>
      </div>

      <div className="library-toolbar">
        <label className="library-search">
          <Search size={18} />
          <input
            value={query}
            onChange={(event) => {
              setQuery(event.target.value)
              const next = new URLSearchParams(searchParams)
              if (event.target.value) next.set('q', event.target.value)
              else next.delete('q')
              setSearchParams(next, { replace: true })
            }}
            placeholder="在资源库中搜索…"
          />
        </label>
        <div className="filter-label"><Filter size={16} /> 按类型筛选</div>
      </div>

      <div className="library-layout">
        <aside className="library-sidebar" aria-label="资源类型">
          {types.map((type) => {
            const href = type === 'all' ? '/library' : `/library/${type}`
            const label = type === 'all' ? '全部资源' : resourceTypeMeta[type].plural
            const count = searchResources('', type).length
            return <Link key={type} className={selectedType === type ? 'active' : ''} to={href}>{label}<span>{count}</span></Link>
          })}
        </aside>

        <section className="library-content">
          <div className="results-header">
            <span>共 {results.length} 项{query && <>匹配“{query}”</>}</span>
            <span>按相关性排序</span>
          </div>
          {results.length ? (
            <div className="resource-list">
              {results.map((resource) => <ResourceRow key={resource.slug} resource={resource} />)}
            </div>
          ) : (
            <div className="empty-library">
              <Search size={28} />
              <h2>没有找到相关内容</h2>
              <p>试试更短的任务描述、英文技术名称，或查看全部资源。</p>
              <Link className="primary-button" to="/library">查看全部资源</Link>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
