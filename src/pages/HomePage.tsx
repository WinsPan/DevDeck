import { ArrowRight, Box, Braces, FileCode2, ListChecks, Search, ShieldCheck, TerminalSquare } from 'lucide-react'
import { Link } from 'react-router-dom'
import { resources } from '../data/resources'
import { ResourceRow } from '../components/ResourceRow'
import type { ResourceType } from '../data/types'

const categoryItems: { type: ResourceType; title: string; description: string; icon: typeof Box }[] = [
  { type: 'tool', title: '在线工具', description: '本地处理数据、编码与文本', icon: Braces },
  { type: 'command', title: '命令方案', description: '按目标生成可复制命令', icon: TerminalSquare },
  { type: 'image', title: 'OCI 镜像', description: '可信镜像与运行配方', icon: Box },
  { type: 'template', title: '配置模板', description: '带验证与回退的配置起点', icon: FileCode2 },
  { type: 'guide', title: '分步指南', description: '从零完成一项开发任务', icon: ListChecks },
]

const quickTasks = ['排查端口占用', '安全撤销 Git 修改', '清理 Docker 磁盘', '启动 PostgreSQL', '配置反向代理', '搭建邮件测试']

export function HomePage({ onSearch }: { onSearch: () => void }) {
  const featured = resources.filter((resource) => resource.featured && resource.type !== 'guide').slice(0, 7)
  const guides = resources.filter((resource) => resource.type === 'guide' && resource.featured).slice(0, 3)

  return (
    <>
      <section className="home-hero">
        <div className="container hero-inner">
          <div className="hero-eyebrow"><ShieldCheck size={15} /> 内容有版本、有来源、有风险说明</div>
          <h1>开发任务，不必从零搜索。</h1>
          <p>工具、命令、镜像与配置，被整理成可以直接判断、复制和完成的方案。</p>
          <button className="hero-search" onClick={onSearch} type="button">
            <Search size={21} />
            <span>搜索“端口占用”“PostgreSQL”“JWT”或任何任务…</span>
            <kbd>⌘ K</kbd>
          </button>
          <div className="quick-tasks" aria-label="常用任务">
            <span>快速开始</span>
            {quickTasks.map((task) => <button key={task} type="button" onClick={onSearch}>{task}</button>)}
          </div>
        </div>
      </section>

      <section className="container category-strip" aria-label="资源分类">
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
          <div><span className="overline">QUICK ACCESS</span><h2>常用资源</h2></div>
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
