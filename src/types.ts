export type ItemKind = 'tpl' | 'mod' | 'ref'

export interface ItemAuthor {
  name: string
  url?: string
}

export interface InstallSpec {
  type?: string
  artifact?: string
  url?: string
  ref?: string
  subdir?: string
  target?: string
}

export interface StoreItem {
  id: string
  kind: ItemKind
  source: 'hosted' | 'reference'
  name: string
  tagline: string
  summary: string
  version: string
  category: string
  tags: string[]
  icon: string
  accent: string
  author: ItemAuthor | null
  license: string
  contents: Record<string, number> | null
  updated: string
  detailUrl: string
  downloadUrl: string | null
  bundleBytes: number | null
  homepage: string | null
  install: InstallSpec | null
}

export interface StoreIndex {
  schema: string
  generatedAt: string
  site: string
  count: number
  kinds: Record<string, string>
  items: StoreItem[]
}

export const KIND_LABEL: Record<ItemKind, string> = {
  tpl: 'ClawTpl 出厂模板',
  mod: 'ClawMod 资产包',
  ref: '开源引用',
}

export const KIND_SHORT: Record<ItemKind, string> = {
  tpl: 'ClawTpl',
  mod: 'ClawMod',
  ref: '引用',
}

export const CATEGORY_LABEL: Record<string, string> = {
  design: '设计',
  life: '生活',
  engineering: '工程',
  service: '服务',
  general: '通用',
}

export const ASSET_LABEL: Record<string, string> = {
  prompt: '提示词',
  skill: '技能',
  mcp: 'MCP',
  subagent: '子智能体',
  knowledge: '知识库',
  tool: '工具',
}
