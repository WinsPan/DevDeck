import { ArrowRight, Box, Braces, Clock3, Code2, FileCode2, Fingerprint, KeyRound, Link2, ListChecks, Regex, Rows3, Search, ShieldCheck, TerminalSquare } from 'lucide-react'
import { FormEvent, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { resources } from '../data/resources'
import { ResourceRow, resourceHref } from '../components/ResourceRow'
import { searchResources } from '../utils/search'
import type { ResourceType } from '../data/types'

const categoryItems: { type: ResourceType; title: string; description: string; icon: typeof Box }[] = [
  { type: 'tool', title: '在线工具', description: '本地处理数据、编码与文本', icon: Braces },
  { type: 'command', title: '命令方案', description: '按目标生成可复制命令', icon: TerminalSquare },
  { type: 'image', title: 'OCI 镜像', description: '可信镜像与运行配方', icon: Box },
  { type: 'template', title: '配置模板', description: '带验证与回退的配置起点', icon: FileCode2 },
  { type: 'guide', title: '分步指南', description: '从零完成一项开发任务', icon: ListChecks },
]

const directTools = [
  { slug: 'json-workbench', title: 'JSON 格式化', description: '格式化、压缩、校验', icon: Braces, accent: 'violet' },
  { slug: 'encoder-decoder', title: 'Base64 / URL 编码', description: '编码与解码', icon: Code2, accent: 'cyan' },
  { slug: 'timestamp-converter', title: '时间戳转换', description: 'Unix、ISO、本地时间', icon: Clock3, accent: 'amber' },
  { slug: 'jwt-inspector', title: 'JWT 解析', description: 'Header、Payload、有效期', icon: KeyRound, accent: 'rose' },
  { slug: 'regex-workbench', title: '正则测试', description: '匹配、捕获组、替换', icon: Regex, accent: 'rose' },
  { slug: 'query-string-workbench', title: '查询参数', description: 'Query String 与 JSON', icon: Rows3, accent: 'cyan' },
  { slug: 'hash-calculator', title: 'Hash 计算', description: 'SHA-256 / 384 / 512', icon: Fingerprint, accent: 'blue' },
  { slug: 'url-inspector', title: 'URL 解析', description: '结构与跟踪参数', icon: Link2, accent: 'green' },
]

const directTasks = [
  { label: '排查端口占用', slug: 'find-port-process' },
  { label: '安全撤销 Git 修改', slug: 'git-undo-changes' },
  { label: '清理 Docker 磁盘', slug: 'docker-disk-cleanup' },
  { label: '启动 PostgreSQL', slug: 'local-postgres-environment' },
  { label: '配置反向代理', slug: 'nginx-reverse-proxy' },
  { label: '搭建邮件测试', slug: 'local-email-testing' },
]

export function HomePage({ onSearch }: { onSearch: () => void }) {
  const [query, setQuery] = useState('')
  const navigate = useNavigate()
  const featured = resources.filter((resource) => resource.featured && resource.type !== 'guide' && resource.type !== 'tool').slice(0, 7)
  const guides = resources.filter((resource) => resource.type === 'guide' && resource.featured).slice(0, 3)

  const submitSearch = (event: FormEvent) => {
    event.preventDefault()
    const first = searchResources(query)[0]
    if (first) navigate(resourceHref(first))
    else navigate(`/library?q=${encodeURIComponent(query)}`)
  }

  return (
    <>
      <section className="home-hero direct-hero">
        <div className="container hero-inner">
          <div className="hero-eyebrow"><ShieldCheck size={15} /> 常用功能，一步直达</div>
          <h1>找到功能，然后直接开始。</h1>
          <p>无需先进入分类。常用工具就在首页，输入名称也可以按 Enter 直达最相关功能。</p>
          <form className="hero-search direct-search" onSubmit={submitSearch}>
            <Search size={21} />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="输入“JSON 格式化”“端口占用”或“PostgreSQL”…" aria-label="直接查找功能" />
            {query ? <button type="submit">直达 <ArrowRight size={15} /></button> : <button type="button" onClick={onSearch}><kbd>⌘ K</kbd><span>全部搜索</span></button>}
          </form>
          <div className="quick-tasks" aria-label="常用任务">
            <span>任务直达</span>
            {directTasks.map((task) => <Link key={task.slug} to={`/resources/${task.slug}`}>{task.label}</Link>)}
          </div>
        </div>
      </section>

      <section className="container direct-tools-section" aria-labelledby="direct-tools-title">
        <div className="direct-tools-heading"><div><span className="overline">ONE-CLICK TOOLS</span><h2 id="direct-tools-title">常用工具</h2></div><Link to="/library/tool">全部工具 <ArrowRight size={15} /></Link></div>
        <div className="direct-tools-grid">
          {directTools.map(({ slug, title, description, icon: Icon, accent }) => <Link key={slug} to={`/tools/${slug}`} className="direct-tool-card"><span className={`resource-icon accent-${accent}`}><Icon size={19} /></span><span><strong>{title}</strong><small>{description}</small></span><ArrowRight size={16} /></Link>)}
        </div>
      </section>

      <section className="container category-strip secondary-categories" aria-label="更多资源分类">
        {categoryItems.map(({ type, title, description, icon: Icon }) => (
          <Link key={type} to={`/library/${type}`} className="category-item">
            <span className="category-icon"><Icon size={19} /></span>
            <span><strong>{title}</strong><small>{description}</small></span>
            <ArrowRight size={16} />
          </Link>
        ))}
      </section>

      <section className="container home-section">
        <div className="section-heading">
          <div><span className="overline">TASK RECIPES</span><h2>常用方案</h2></div>
          <Link to="/library">查看全部 <ArrowRight size={15} /></Link>
        </div>
        <div className="resource-list featured-list">
          {featured.map((resource) => <ResourceRow key={resource.slug} resource={resource} />)}
        </div>
      </section>

      <section className="guides-section">
        <div className="container">
          <div className="section-heading">
            <div><span className="overline">GUIDED RECIPES</span><h2>从零完成</h2><p>不是命令清单，而是带检查点与回退方式的完整路径。</p></div>
            <Link to="/library/guide">全部指南 <ArrowRight size={15} /></Link>
          </div>
          <div className="guide-grid">
            {guides.map((guide, index) => (
              <Link key={guide.slug} to={`/resources/${guide.slug}`} className="guide-card">
                <span className="guide-index">0{index + 1}</span>
                <span className="type-label">分步指南</span>
                <h3>{guide.title}</h3>
                <p>{guide.summary}</p>
                <div className="guide-meta"><span>{guide.sections.length} 个步骤</span><span>{guide.platforms[0]}</span></div>
                <span className="guide-link">开始指南 <ArrowRight size={16} /></span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="container trust-section">
        <div className="trust-copy">
          <span className="overline">WHY DEVDECK</span>
          <h2>少一点复制粘贴，多一点确定性。</h2>
          <p>每条内容都说明适用环境、风险、验证方式与来源。DevDeck 不在网页中执行命令，也不把本地工具的输入发送到服务端。</p>
        </div>
        <div className="trust-points">
          <div><strong>本地优先</strong><span>敏感转换尽可能留在浏览器</span></div>
          <div><strong>先检查，再修改</strong><span>危险操作优先给出只读检查</span></div>
          <div><strong>不仅是答案</strong><span>同时给出验证、限制与回退方式</span></div>
        </div>
      </section>
    </>
  )
}
