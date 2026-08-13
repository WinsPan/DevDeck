import { describe, expect, it } from 'vitest'
import { analyzeJson, base64Decode, base64Encode, cleanTrackingUrl, decodeJwt, formatJson, hexDecode, hexEncode, randomSecret, sortJsonKeys, textStats } from './toolLogic'

describe('tool logic', () => {
  it('formats valid JSON', () => {
    expect(formatJson('{"a":1}')).toBe('{\n  "a": 1\n}')
  })

  it('analyzes and formats JSON instantly', () => {
    expect(analyzeJson('{"b":2,"a":1}', { indent: 2, sortKeys: true })).toMatchObject({
      valid: true,
      rootType: 'object',
      itemCount: 2,
      output: '{\n  "a": 1,\n  "b": 2\n}',
    })
  })

  it('reports invalid JSON without a stale output', () => {
    const result = analyzeJson('{"a":}')
    expect(result.valid).toBe(false)
    expect(result.output).toBe('')
    expect(result.error).toBeTruthy()
  })

  it('sorts nested object keys but keeps array order', () => {
    expect(sortJsonKeys({ z: { b: 2, a: 1 }, a: [{ d: 4, c: 3 }] })).toEqual({
      a: [{ c: 3, d: 4 }],
      z: { a: 1, b: 2 },
    })
  })

  it('round-trips Unicode through Base64', () => {
    const input = 'DevDeck 你好 👋'
    expect(base64Decode(base64Encode(input))).toBe(input)
  })

  it('round-trips Unicode through Hex', () => {
    const input = 'Cloudflare 边缘'
    expect(hexDecode(hexEncode(input))).toBe(input)
  })

  it('generates requested secret length', () => {
    expect(randomSecret(48)).toHaveLength(48)
  })

  it('removes common tracking parameters and keeps business parameters', () => {
    const result = cleanTrackingUrl('https://example.com/p?id=42&utm_source=test&fbclid=abc')
    expect(result.clean).toBe('https://example.com/p?id=42')
    expect(result.removed).toEqual(['utm_source', 'fbclid'])
  })

  it('counts Unicode characters and lines', () => {
    expect(textStats('你a\n好')).toMatchObject({ characters: 4, lines: 2 })
  })

  it('decodes a JWT without claiming signature verification', () => {
    const jwt = `${base64Url('{"alg":"none"}')}.${base64Url('{"sub":"123"}')}.signature`
    expect(decodeJwt(jwt).payload.sub).toBe('123')
  })
})

function base64Url(value: string) {
  return base64Encode(value).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')
}
