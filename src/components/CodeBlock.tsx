import { useState } from 'react'
import { Check, Copy, WrapText } from 'lucide-react'
import type { CodeVariant } from '../data/types'

export function CodeBlock({ variants }: { variants: CodeVariant[] }) {
  const [active, setActive] = useState(0)
  const [copied, setCopied] = useState(false)
  const [wrap, setWrap] = useState(false)
  const item = variants[active]

  const copy = async () => {
    await navigator.clipboard.writeText(item.code)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1800)
  }

  return (
    <div className="code-block">
      <div className="code-toolbar">
        <div className="code-tabs" role="tablist">
          {variants.map((variant, index) => (
            <button
              key={`${variant.label}-${index}`}
              className={index === active ? 'active' : ''}
              onClick={() => setActive(index)}
              type="button"
              role="tab"
              aria-selected={index === active}
            >
              {variant.label}
            </button>
          ))}
        </div>
        <div className="code-actions">
          <button className={wrap ? 'active' : ''} type="button" onClick={() => setWrap((value) => !value)} aria-label="切换自动换行" title="自动换行">
            <WrapText size={16} />
          </button>
          <button type="button" onClick={copy} aria-label="复制代码">
            {copied ? <Check size={16} /> : <Copy size={16} />}
            <span>{copied ? '已复制' : '复制'}</span>
          </button>
        </div>
      </div>
      <pre className={wrap ? 'wrap' : ''}><code>{item.code}</code></pre>
      {item.description && <div className="code-description">{item.description}</div>}
    </div>
  )
}
