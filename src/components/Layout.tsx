import type { ReactNode } from 'react'
import { useState } from 'react'
import { GitBranch, Menu, Moon, Search, Sun, X } from 'lucide-react'
import { Link, NavLink } from 'react-router-dom'
import { useTheme } from '../hooks/useTheme'

interface LayoutProps {
  children: ReactNode
  onSearch: () => void
}

export function Layout({ children, onSearch }: LayoutProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const { theme, setTheme } = useTheme()
  const effectiveDark = document.documentElement.dataset.theme === 'dark'

  const toggleTheme = () => setTheme(effectiveDark || theme === 'dark' ? 'light' : 'dark')

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">跳到主要内容</a>
      <header className="site-header">
        <div className="header-inner">
          <Link className="brand" to="/" aria-label="DevDeck 首页">
            <span className="brand-mark" aria-hidden="true">D</span>
            <span>DevDeck</span>
          </Link>

          <nav className={menuOpen ? 'main-nav open' : 'main-nav'} aria-label="主导航">
            <NavLink to="/library" onClick={() => setMenuOpen(false)}>资源库</NavLink>
            <NavLink to="/library/guide" onClick={() => setMenuOpen(false)}>分步指南</NavLink>
            <a href="https://github.com/WinsPan/DevDeck" target="_blank" rel="noreferrer">参与贡献</a>
          </nav>

          <button className="header-search" onClick={onSearch} type="button">
            <Search size={17} aria-hidden="true" />
            <span>搜索工具、命令、镜像或任务…</span>
            <kbd>⌘ K</kbd>
          </button>

          <div className="header-actions">
            <button className="icon-button" onClick={onSearch} type="button" aria-label="搜索">
              <Search size={19} />
            </button>
            <button className="icon-button" onClick={toggleTheme} type="button" aria-label="切换亮色或深色主题">
              {effectiveDark ? <Sun size={19} /> : <Moon size={19} />}
            </button>
            <a className="icon-button desktop-only" href="https://github.com/WinsPan/DevDeck" target="_blank" rel="noreferrer" aria-label="GitHub 仓库">
              <GitBranch size={19} />
            </a>
            <button className="icon-button menu-button" onClick={() => setMenuOpen((value) => !value)} type="button" aria-label="打开导航菜单">
              {menuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </header>

      <main id="main-content">{children}</main>

      <footer className="site-footer">
        <div className="footer-inner">
          <div>
            <Link className="brand footer-brand" to="/">
              <span className="brand-mark" aria-hidden="true">D</span>
              <span>DevDeck</span>
            </Link>
            <p>把开发环境与常见任务，整理成可信、可复制的方案。</p>
          </div>
          <div className="footer-links">
            <Link to="/library">资源库</Link>
            <Link to="/library/guide">分步指南</Link>
            <a href="https://github.com/WinsPan/DevDeck" target="_blank" rel="noreferrer">GitHub</a>
          </div>
        </div>
        <div className="footer-meta">内容仅供技术参考。执行命令前请确认目标、版本与影响范围。</div>
      </footer>
    </div>
  )
}
