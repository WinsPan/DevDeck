import { ArrowLeft } from 'lucide-react'
import { Link } from 'react-router-dom'

export function NotFoundPage() {
  return (
    <div className="not-found page-container">
      <span className="error-code">404</span>
      <h1>这里还没有对应的资源</h1>
      <p>链接可能已更新，或者这项内容尚未加入 DevDeck。</p>
      <Link className="primary-button" to="/"><ArrowLeft size={17} /> 返回首页</Link>
    </div>
  )
}
