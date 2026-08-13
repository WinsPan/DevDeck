import { useMemo, useState } from 'react'
import { Check, Copy, RefreshCw } from 'lucide-react'

interface ServicePreset {
  name: string
  image: string
  container: string
  port: number
  containerPort: number
  volume?: [string, string]
  environment: Array<[string, string, boolean]>
  command?: string
  healthcheck?: string
}

const services: Record<string, ServicePreset> = {
  postgres: { name: 'PostgreSQL', image: 'postgres:17', container: 'postgres', port: 5432, containerPort: 5432, volume: ['postgres-data', '/var/lib/postgresql/data'], environment: [['POSTGRES_DB', 'app', false], ['POSTGRES_USER', 'app', false], ['POSTGRES_PASSWORD', '<GENERATE_PASSWORD>', true]], healthcheck: 'pg_isready -U $$POSTGRES_USER -d $$POSTGRES_DB' },
  valkey: { name: 'Valkey', image: 'valkey/valkey:8', container: 'valkey', port: 6379, containerPort: 6379, volume: ['valkey-data', '/data'], environment: [], command: 'valkey-server --appendonly yes', healthcheck: 'valkey-cli ping' },
  mysql: { name: 'MySQL', image: 'mysql:8.4', container: 'mysql', port: 3306, containerPort: 3306, volume: ['mysql-data', '/var/lib/mysql'], environment: [['MYSQL_DATABASE', 'app', false], ['MYSQL_USER', 'app', false], ['MYSQL_PASSWORD', '<GENERATE_PASSWORD>', true], ['MYSQL_ROOT_PASSWORD', '<GENERATE_ROOT_PASSWORD>', true]], healthcheck: 'mysqladmin ping -h localhost' },
  mongo: { name: 'MongoDB', image: 'mongo:8', container: 'mongo', port: 27017, containerPort: 27017, volume: ['mongo-data', '/data/db'], environment: [['MONGO_INITDB_ROOT_USERNAME', 'admin', false], ['MONGO_INITDB_ROOT_PASSWORD', '<GENERATE_PASSWORD>', true]], healthcheck: 'mongosh --eval "db.adminCommand(\'ping\')"' },
  mailpit: { name: 'Mailpit', image: 'axllent/mailpit:latest', container: 'mailpit', port: 8025, containerPort: 8025, environment: [], healthcheck: 'wget --spider -q http://localhost:8025/readyz' },
  minio: { name: 'MinIO', image: 'minio/minio:latest', container: 'minio', port: 9000, containerPort: 9000, volume: ['minio-data', '/data'], environment: [['MINIO_ROOT_USER', 'minioadmin', false], ['MINIO_ROOT_PASSWORD', '<GENERATE_PASSWORD>', true]], command: 'server /data --console-address :9001', healthcheck: 'mc ready local' },
}

function yamlQuote(value: string) { return `"${value.replace(/"/g, '\\"')}"` }
function shellQuote(value: string) { return `'${value.replace(/'/g, `'"'"'`)}'` }

function CopyConfig({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false)
  return <button className="tool-button" type="button" onClick={async () => { await navigator.clipboard.writeText(value); setCopied(true); window.setTimeout(() => setCopied(false), 1400) }}>{copied ? <Check size={15} /> : <Copy size={15} />}{copied ? '已复制' : label}</button>
}

export default function DockerGenerator() {
  const [serviceKey, setServiceKey] = useState('postgres')
  const [name, setName] = useState(services.postgres.container)
  const [hostPort, setHostPort] = useState(services.postgres.port)
  const [restart, setRestart] = useState('unless-stopped')
  const [persist, setPersist] = useState(true)
  const [healthcheck, setHealthcheck] = useState(true)
  const [values, setValues] = useState<Record<string, string>>(() => Object.fromEntries(services.postgres.environment.map(([key, value]) => [key, value])))
  const service = services[serviceKey]

  const selectService = (key: string) => {
    const next = services[key]
    setServiceKey(key); setName(next.container); setHostPort(next.port); setValues(Object.fromEntries(next.environment.map(([env, value]) => [env, value])))
  }
  const generateSecret = (key: string) => {
    const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789-_'
    const bytes = crypto.getRandomValues(new Uint8Array(32))
    setValues((current) => ({ ...current, [key]: Array.from(bytes, (byte) => alphabet[byte % alphabet.length]).join('') }))
  }

  const generated = useMemo(() => {
    const envEntries = service.environment.map(([key]) => [key, values[key] ?? ''] as const)
    const runParts = ['docker run --detach', `--name ${shellQuote(name)}`, `--restart ${restart}`, `--publish 127.0.0.1:${hostPort}:${service.containerPort}`]
    if (serviceKey === 'mailpit') runParts.push('--publish 127.0.0.1:1025:1025')
    if (serviceKey === 'minio') runParts.push('--publish 127.0.0.1:9001:9001')
    if (persist && service.volume) runParts.push(`--volume ${service.volume[0]}:${service.volume[1]}`)
    envEntries.forEach(([key, value]) => runParts.push(`--env ${key}=${shellQuote(value)}`))
    runParts.push(service.image)
    if (service.command) runParts.push(service.command)
    const dockerRun = runParts.join(' \\\n  ')

    const compose: string[] = ['services:', `  ${name}:`, `    image: ${service.image}`, `    container_name: ${name}`, `    restart: ${restart}`, '    ports:', `      - "127.0.0.1:${hostPort}:${service.containerPort}"`]
    if (serviceKey === 'mailpit') compose.push('      - "127.0.0.1:1025:1025"')
    if (serviceKey === 'minio') compose.push('      - "127.0.0.1:9001:9001"')
    if (envEntries.length) { compose.push('    environment:'); envEntries.forEach(([key]) => compose.push(`      ${key}: \${${key}:?set in .env}`)) }
    if (persist && service.volume) compose.push('    volumes:', `      - ${service.volume[0]}:${service.volume[1]}`)
    if (service.command) compose.push(`    command: ${service.command}`)
    if (healthcheck && service.healthcheck) compose.push('    healthcheck:', `      test: ["CMD-SHELL", ${yamlQuote(service.healthcheck)}]`, '      interval: 10s', '      timeout: 5s', '      retries: 5')
    if (persist && service.volume) compose.push('', 'volumes:', `  ${service.volume[0]}:`)
    const env = envEntries.map(([key, value]) => `${key}=${value}`).join('\n')
    return { dockerRun, compose: compose.join('\n'), env }
  }, [service, serviceKey, name, hostPort, restart, persist, healthcheck, values])

  return <div className="docker-generator">
    <div className="service-tabs">{Object.entries(services).map(([key, preset]) => <button type="button" key={key} className={serviceKey === key ? 'active' : ''} onClick={() => selectService(key)}>{preset.name}</button>)}</div>
    <div className="generator-layout"><div className="generator-form"><div className="generator-fields"><label><span>容器名称</span><input value={name} onChange={(event) => setName(event.target.value.replace(/[^a-zA-Z0-9_.-]/g, ''))} /></label><label><span>主机端口</span><input type="number" min="1" max="65535" value={hostPort} onChange={(event) => setHostPort(Number(event.target.value))} /></label><label><span>重启策略</span><select value={restart} onChange={(event) => setRestart(event.target.value)}><option>unless-stopped</option><option>always</option><option>on-failure</option><option>no</option></select></label></div><div className="generator-checks"><label className="check-option"><input type="checkbox" checked={persist} onChange={(event) => setPersist(event.target.checked)} disabled={!service.volume} />持久化数据</label><label className="check-option"><input type="checkbox" checked={healthcheck} onChange={(event) => setHealthcheck(event.target.checked)} disabled={!service.healthcheck} />健康检查</label></div>{service.environment.length > 0 && <section className="env-editor"><div className="panel-heading"><span>环境变量</span></div>{service.environment.map(([key, , secret]) => <label key={key}><span>{key}{secret && <small>Secret</small>}</span><input type={secret ? 'password' : 'text'} value={values[key] ?? ''} onChange={(event) => setValues((current) => ({ ...current, [key]: event.target.value }))} />{secret && <button type="button" onClick={() => generateSecret(key)} title="生成随机值"><RefreshCw size={14} /></button>}</label>)}</section>}</div><div className="generated-config"><div className="generated-tabs"><strong>{service.name}</strong><span>{service.image}</span></div><ConfigPanel title="docker run" value={generated.dockerRun} /><ConfigPanel title="compose.yaml" value={generated.compose} />{generated.env && <ConfigPanel title=".env" value={generated.env} />}</div></div>
    <div className="docker-warning">端口默认只绑定到 127.0.0.1。示例面向本地开发，生产环境还需要备份、访问控制、资源限制和版本固定策略。</div>
  </div>
}

function ConfigPanel({ title, value }: { title: string; value: string }) {
  return <div className="config-panel"><div><strong>{title}</strong><CopyConfig value={value} label="复制" /></div><pre>{value}</pre></div>
}
