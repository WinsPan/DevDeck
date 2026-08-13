export type ResourceType = 'tool' | 'command' | 'image' | 'template' | 'guide'
export type RiskLevel = 'safe' | 'caution' | 'danger'

export interface CodeVariant {
  label: string
  language: string
  code: string
  description?: string
}

export interface ResourceSection {
  title: string
  body?: string
  bullets?: string[]
  code?: CodeVariant[]
}

export interface Resource {
  slug: string
  type: ResourceType
  title: string
  englishTitle?: string
  summary: string
  description: string
  aliases: string[]
  tags: string[]
  platforms: string[]
  verified: string
  version?: string
  source?: string
  sourceLabel?: string
  featured?: boolean
  risk?: RiskLevel
  accent?: string
  sections: ResourceSection[]
}

export interface SearchResult extends Resource {
  score: number
}
