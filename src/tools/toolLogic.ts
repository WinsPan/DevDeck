export type ToolKind = 'json' | 'encoder' | 'timestamp' | 'jwt' | 'generator' | 'hash' | 'text' | 'url' | 'regex' | 'query' | 'diff' | 'cron' | 'sql' | 'cidr' | 'curl' | 'docker'

export function toolKindFromSlug(slug: string): ToolKind | undefined {
  const map: Record<string, ToolKind> = {
    'json-workbench': 'json',
    'encoder-decoder': 'encoder',
    'timestamp-converter': 'timestamp',
    'jwt-inspector': 'jwt',
    'id-secret-generator': 'generator',
    'hash-calculator': 'hash',
    'text-workbench': 'text',
    'url-inspector': 'url',
    'regex-workbench': 'regex',
    'query-string-workbench': 'query',
    'text-diff-workbench': 'diff',
    'cron-workbench': 'cron',
    'sql-workbench': 'sql',
    'cidr-calculator': 'cidr',
    'curl-generator': 'curl',
    'docker-service-generator': 'docker',
  }
  return map[slug]
}

export function formatJson(input: string, indent = 2) {
  if (!input.trim()) return ''
  return JSON.stringify(JSON.parse(input), null, indent)
}

export function minifyJson(input: string) {
  if (!input.trim()) return ''
  return JSON.stringify(JSON.parse(input))
}

export function sortJsonKeys(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortJsonKeys)
  if (value !== null && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, child]) => [key, sortJsonKeys(child)]),
    )
  }
  return value
}

export interface JsonAnalysis {
  valid: boolean
  output: string
  error?: string
  line?: number
  column?: number
  rootType?: 'object' | 'array' | 'string' | 'number' | 'boolean' | 'null'
  itemCount?: number
  bytes: number
}

export function analyzeJson(input: string, options: { indent?: number; sortKeys?: boolean; compact?: boolean } = {}): JsonAnalysis {
  const bytes = new TextEncoder().encode(input).byteLength
  if (!input.trim()) return { valid: false, output: '', bytes }

  try {
    const parsed: unknown = JSON.parse(input)
    const value = options.sortKeys ? sortJsonKeys(parsed) : parsed
    const rootType = parsed === null ? 'null' : Array.isArray(parsed) ? 'array' : typeof parsed as JsonAnalysis['rootType']
    const itemCount = Array.isArray(parsed)
      ? parsed.length
      : parsed !== null && typeof parsed === 'object'
        ? Object.keys(parsed).length
        : undefined

    return {
      valid: true,
      output: JSON.stringify(value, null, options.compact ? 0 : options.indent ?? 2),
      rootType,
      itemCount,
      bytes,
    }
  } catch (caught) {
    const raw = caught instanceof Error ? caught.message : 'JSON 解析失败'
    const positionMatch = raw.match(/position\s+(\d+)/i)
    const lineColumnMatch = raw.match(/line\s+(\d+)\s+column\s+(\d+)/i)
    let line = lineColumnMatch ? Number(lineColumnMatch[1]) : undefined
    let column = lineColumnMatch ? Number(lineColumnMatch[2]) : undefined

    if (positionMatch && (!line || !column)) {
      const position = Number(positionMatch[1])
      const before = input.slice(0, position)
      const lines = before.split('\n')
      line = lines.length
      column = (lines.at(-1)?.length ?? 0) + 1
    }

    return {
      valid: false,
      output: '',
      error: raw.replace(/^JSON\.parse:\s*/i, ''),
      line,
      column,
      bytes,
    }
  }
}

export function base64Encode(input: string) {
  const bytes = new TextEncoder().encode(input)
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary)
}

export function base64Decode(input: string) {
  const binary = atob(input.replace(/\s/g, ''))
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0))
  return new TextDecoder().decode(bytes)
}

export function hexEncode(input: string) {
  return Array.from(new TextEncoder().encode(input), (byte) => byte.toString(16).padStart(2, '0')).join(' ')
}

export function hexDecode(input: string) {
  const clean = input.replace(/0x/gi, '').replace(/[^0-9a-f]/gi, '')
  if (clean.length % 2) throw new Error('Hex 字符数必须为偶数')
  const bytes = new Uint8Array(clean.match(/.{2}/g)?.map((value) => Number.parseInt(value, 16)) ?? [])
  return new TextDecoder().decode(bytes)
}

export function decodeJwt(input: string) {
  const parts = input.trim().split('.')
  if (parts.length !== 3) throw new Error('JWT 应包含 Header、Payload 和 Signature 三部分')
  const decodePart = (part: string) => {
    const padded = part.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(part.length / 4) * 4, '=')
    return JSON.parse(base64Decode(padded)) as Record<string, unknown>
  }
  return { header: decodePart(parts[0]), payload: decodePart(parts[1]), signature: parts[2] }
}

export function randomSecret(length: number, alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_') {
  if (length < 1 || length > 1024) throw new Error('长度应在 1 到 1024 之间')
  const result: string[] = []
  const max = 256 - (256 % alphabet.length)
  while (result.length < length) {
    const bytes = crypto.getRandomValues(new Uint8Array(Math.ceil((length - result.length) * 1.5)))
    for (const byte of bytes) {
      if (byte < max && result.length < length) result.push(alphabet[byte % alphabet.length])
    }
  }
  return result.join('')
}

export function uuidV4() {
  return crypto.randomUUID()
}

export async function digestText(input: string, algorithm: 'SHA-256' | 'SHA-384' | 'SHA-512') {
  const digest = await crypto.subtle.digest(algorithm, new TextEncoder().encode(input))
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('')
}

export function textStats(input: string) {
  return {
    characters: Array.from(input).length,
    charactersNoSpaces: Array.from(input.replace(/\s/g, '')).length,
    lines: input ? input.split(/\r?\n/).length : 0,
    words: input.trim() ? input.trim().split(/\s+/).length : 0,
    bytes: new Blob([input]).size,
  }
}

export function cleanTrackingUrl(input: string) {
  const url = new URL(input)
  const tracking = /^(utm_.+|fbclid|gclid|dclid|msclkid|mc_cid|mc_eid|igshid|ref_src)$/i
  const removed: string[] = []
  for (const key of Array.from(url.searchParams.keys())) {
    if (tracking.test(key)) {
      url.searchParams.delete(key)
      removed.push(key)
    }
  }
  return { clean: url.toString(), removed, url }
}
