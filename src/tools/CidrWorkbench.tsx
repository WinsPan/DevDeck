import { useMemo, useState } from 'react'
import { Check, Copy } from 'lucide-react'
import { parseIpv4Cidr, splitIpv4Cidr } from './cidrLogic'

function CopyValue({ value }: { value: string }) {
  const [copied, setCopied] = useState(false)
  return <button type="button" onClick={async () => { await navigator.clipboard.writeText(value); setCopied(true); window.setTimeout(() => setCopied(false), 1200) }}>{copied ? <Check size={14} /> : <Copy size={14} />}{copied ? '已复制' : '复制'}</button>
}

export default function CidrWorkbench() {
  const [input, setInput] = useState('192.168.1.10/24')
  const [newPrefix, setNewPrefix] = useState(26)
  const result = useMemo(() => {
    try { return { data: parseIpv4Cidr(input), error: '' } }
    catch (caught) { return { data: undefined, error: caught instanceof Error ? caught.message : 'CIDR 无效' } }
  }, [input])
  const subnets = useMemo(() => {
    if (!result.data || newPrefix <= result.data.prefix) return { values: [] as string[], error: '' }
    try { return { values: splitIpv4Cidr(input, newPrefix), error: '' } }
    catch (caught) { return { values: [] as string[], error: caught instanceof Error ? caught.message : '无法划分子网' } }
  }, [input, newPrefix, result.data])

  const rows = result.data ? [
    ['IP 地址', result.data.address],
    ['网络地址', `${result.data.network}/${result.data.prefix}`],
    ['广播地址', result.data.broadcast],
    ['子网掩码', result.data.netmask],
    ['Wildcard', result.data.wildcard],
    ['首个可用地址', result.data.firstHost],
    ['最后可用地址', result.data.lastHost],
  ] : []

  return <div className="cidr-workbench">
    <label className="cidr-input"><span>IPv4 / CIDR</span><input autoFocus value={input} onChange={(event) => setInput(event.target.value)} placeholder="192.168.1.10/24" spellCheck={false} /></label>
    {result.error && <div className="tool-error">{result.error}</div>}
    {result.data && <>
      <div className="cidr-summary"><div><strong>{result.data.totalAddresses.toLocaleString()}</strong><span>地址总数</span></div><div><strong>{result.data.usableHosts.toLocaleString()}</strong><span>可用主机</span></div><div><strong>/{result.data.prefix}</strong><span>前缀长度</span></div><div><strong>{result.data.privateRange ? '私有' : '公网'}</strong><span>地址范围</span></div></div>
      <div className="cidr-results">{rows.map(([label, value]) => <div key={label}><span>{label}</span><code>{value}</code><CopyValue value={value} /></div>)}</div>
      <div className="cidr-binary"><span>二进制地址</span><code>{result.data.binary}</code></div>
      <section className="subnet-splitter"><div className="subnet-heading"><div><strong>子网划分</strong><span>把 {result.data.network}/{result.data.prefix} 划分为更小的网络</span></div><label><span>新前缀</span><input type="number" min={result.data.prefix + 1} max="32" value={newPrefix} onChange={(event) => setNewPrefix(Number(event.target.value))} /></label></div>{subnets.error && <div className="tool-error">{subnets.error}</div>}<div className="subnet-list">{subnets.values.map((subnet, index) => <div key={subnet}><span>{String(index + 1).padStart(2, '0')}</span><code>{subnet}</code></div>)}</div></section>
    </>}
  </div>
}
