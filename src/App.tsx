import { Route, Routes, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { Layout } from './components/Layout'
import { SearchDialog } from './components/SearchDialog'
import { HomePage } from './pages/HomePage'
import { LibraryPage } from './pages/LibraryPage'
import { ResourcePage } from './pages/ResourcePage'
import { ToolPage } from './pages/ToolPage'
import { NotFoundPage } from './pages/NotFoundPage'

export default function App() {
  const [searchOpen, setSearchOpen] = useState(false)
  const location = useLocation()

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [location.pathname])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setSearchOpen((current) => !current)
      }
      if (event.key === '/' && !['INPUT', 'TEXTAREA'].includes((event.target as HTMLElement).tagName)) {
        event.preventDefault()
        setSearchOpen(true)
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  return (
    <>
      <Layout onSearch={() => setSearchOpen(true)}>
        <Routes>
          <Route path="/" element={<HomePage onSearch={() => setSearchOpen(true)} />} />
          <Route path="/library" element={<LibraryPage />} />
          <Route path="/library/:type" element={<LibraryPage />} />
          <Route path="/tools/:slug" element={<ToolPage />} />
          <Route path="/resources/:slug" element={<ResourcePage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Layout>
      <SearchDialog open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  )
}
