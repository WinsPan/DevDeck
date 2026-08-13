interface RegexRequest {
  pattern: string
  flags: string
  input: string
  replacement: string
}

self.onmessage = (event: MessageEvent<RegexRequest>) => {
  const { pattern, flags, input, replacement } = event.data
  try {
    const safeFlags = flags.includes('g') ? flags : `${flags}g`
    const regex = new RegExp(pattern, safeFlags)
    const matches = Array.from(input.matchAll(regex)).slice(0, 200).map((match) => ({
      value: match[0],
      index: match.index,
      groups: match.groups ?? {},
      captures: match.slice(1),
    }))
    const replaced = input.replace(new RegExp(pattern, safeFlags), replacement)
    self.postMessage({ matches, replaced, error: '' })
  } catch (caught) {
    self.postMessage({
      matches: [],
      replaced: '',
      error: caught instanceof Error ? caught.message : '正则表达式无效',
    })
  }
}
