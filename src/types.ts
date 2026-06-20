// Asset kinds — from atomic "bricks" to integrated "packages".
// `source` ('hosted' | 'reference') is orthogonal and is not a kind.
//
// Beyond the four-tier granularity ladder we surface two purpose-typed
// catalogs that users browse by name rather than by granularity:
//   - `smartfolder` —— 智能文件夹模板 (a SmartSpace kind pack: drops a
//     system/smartspace/kinds/<kind>/ tree into the workspace).
//   - `biztpl`      —— 业务模板 (declarative behavior templates: goals /
//     workflows / research scaffolds under business/).
export type ItemKind = 'brick' | 'mod' | 'tpl' | 'pkg' | 'smartfolder' | 'biztpl'

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
  brick: 'ClawBrick 智能原子',
  mod: 'ClawMod 智能组件',
  tpl: 'ClawTpl 智能体模板',
  pkg: 'ClawPkg 智能体包',
  smartfolder: '智能文件夹',
  biztpl: '业务模板',
}

export const KIND_SHORT: Record<ItemKind, string> = {
  brick: '原子',
  mod: '组件',
  tpl: '模板',
  pkg: '智能体',
  smartfolder: '文件夹',
  biztpl: '业务',
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
