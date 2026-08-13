import { resources } from '../data/resources'
import type { Resource, ResourceType, SearchResult } from '../data/types'

const normalize = (value: string) =>
  value
    .toLocaleLowerCase('zh-CN')
    .normalize('NFKC')
    .replace(/[\s_./-]+/g, ' ')
    .trim()

export function searchResources(query: string, type?: ResourceType | 'all'): SearchResult[] {
  const normalized = normalize(query)
  const terms = normalized.split(' ').filter(Boolean)

  return resources
    .filter((resource) => !type || type === 'all' || resource.type === type)
    .map((resource) => ({ ...resource, score: scoreResource(resource, normalized, terms) }))
    .filter((resource) => !normalized || resource.score > 0)
    .sort((a, b) => b.score - a.score || Number(Boolean(b.featured)) - Number(Boolean(a.featured)) || a.title.localeCompare(b.title, 'zh-CN'))
}

function scoreResource(resource: Resource, query: string, terms: string[]) {
  if (!query) return resource.featured ? 10 : 1

  const title = normalize(`${resource.title} ${resource.englishTitle ?? ''}`)
  const aliases = normalize(resource.aliases.join(' '))
  const tags = normalize(resource.tags.join(' '))
  const summary = normalize(`${resource.summary} ${resource.description}`)
  let score = 0

  if (title === query) score += 120
  if (title.startsWith(query)) score += 70
  if (title.includes(query)) score += 45
  if (aliases.includes(query)) score += 34
  if (tags.includes(query)) score += 24
  if (summary.includes(query)) score += 12

  for (const term of terms) {
    if (title.includes(term)) score += 15
    if (aliases.includes(term)) score += 10
    if (tags.includes(term)) score += 7
    if (summary.includes(term)) score += 3
  }

  return score
}
