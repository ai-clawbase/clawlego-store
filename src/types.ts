// Asset kinds — from atomic "bricks" to integrated "packages".
// `source` ('hosted' | 'reference') is orthogonal and is not a kind.
export type ItemKind = 'brick' | 'mod' | 'tpl' | 'pkg'

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
  brick: 'ClawBrick 原子积木',
  mod: 'ClawMod 功能组件',
  tpl: 'ClawTpl 角色模版',
  pkg: 'ClawPkg 智能体包',
}

export const KIND_SHORT: Record<ItemKind, string> = {
  brick: '积木',
  mod: '组件',
  tpl: '模版',
  pkg: '智能体',
}

export const CATEGORY_LABEL: Record<string, string> = {
  design: '设计',
  life: '生活',
  engineering: '工程',
  service: '服务',
  general: '通用',
}

export const ASSET_LABEL: Record<string, string> = {
  brick: '积木',
  prompt: '提示词',
  skill: '技能',
  mcp: 'MCP',
  subagent: '子智能体',
  knowledge: '知识库',
  tool: '工具',
}
