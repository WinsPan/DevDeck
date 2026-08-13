import { ArrowUpRight, Box, Braces, FileCode2, ListChecks, TerminalSquare } from 'lucide-react'
import { Link } from 'react-router-dom'
import { resourceTypeMeta } from '../data/resources'
import type { Resource, ResourceType } from '../data/types'

const icons = {
  tool: Braces,
  command: TerminalSquare,
  image: Box,
  template: FileCode2,
  guide: ListChecks,
} satisfies Record<ResourceType, typeof Box>

export function resourceHref(resource: Resource) {
  return resource.type === 'tool' ? `/tools/${resource.slug}` : `/resources/${resource.slug}`
}

export function ResourceRow({ resource, compact = false }: { resource: Resource; compact?: boolean }) {
  const Icon = icons[resource.type]

  return (
    <Link className={`resource-row ${compact ? 'compact' : ''}`} to={resourceHref(resource)}>
      <span className={`resource-icon accent-${resource.accent ?? 'blue'}`} aria-hidden="true">
        <Icon size={19} strokeWidth={1.8} />
      </span>
      <span className="resource-copy">
        <span className="resource-line">
          <span className="type-label">{resourceTypeMeta[resource.type].label}</span>
          <strong>{resource.title}</strong>
          {resource.englishTitle && <span className="english-title">{resource.englishTitle}</span>}
        </span>
        <span className="resource-summary">{resource.summary}</span>
        {!compact && (
          <span className="resource-meta">
            <span>{resource.platforms.slice(0, 3).join(' · ')}</span>
            <span>验证于 {resource.verified}</span>
          </span>
        )}
      </span>
      <ArrowUpRight className="resource-arrow" size={18} aria-hidden="true" />
    </Link>
  )
}
