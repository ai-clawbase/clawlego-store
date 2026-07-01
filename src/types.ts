// Asset kinds — from atomic "bricks" to integrated "packages".
// `source` ('hosted' | 'reference') is orthogonal and is not a kind.
//
// Beyond the four-tier granularity ladder we surface two purpose-typed
// catalogs that users browse by name rather than by granularity:
//   - `smartfolder` —— 智能文件夹 (a SmartSpace kind pack: drops a
//     system/smartspace/kinds/<kind>/ tree into the workspace). NB: the store
//     item kind is `smartfolder` (user-facing 文件夹), distinct from the
//     internal `smartspace` kind namespace — the host's install records and the
//     install-status bridge key on `smartfolder` (see handlers_store.go).
//   - `projtpl`      —— 项目模板 (declarative behavior templates: goals /
//     workflows / research scaffolds under business/).
export type ItemKind = 'brick' | 'mod' | 'tpl' | 'pkg' | 'smartfolder' | 'projtpl'

export type InstallScope = 'instance' | 'template-library' | 'new-instance'

export function installScopeOf(kind: ItemKind): InstallScope {
  if (kind === 'tpl') return 'template-library'
  if (kind === 'pkg') return 'new-instance'
  return 'instance'
}

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
  brick: 'ClawBit 智能原子',
  mod: 'ClawMod 智能组件',
  tpl: 'ClawTpl 智能体模板',
  pkg: 'ClawPkg 智能体包',
  smartfolder: '智能文件夹',
  projtpl: '项目模板',
}

export const KIND_SHORT: Record<ItemKind, string> = {
  brick: 'ClawBit',
  mod: '组件',
  tpl: '模板',
  pkg: '智能体',
  smartfolder: '文件夹',
  projtpl: '业务',
}

// Project templates (`projtpl`) are sub-typed by where they install under
// business/: goals/ · research/ · workflows/. The card badge surfaces this
// concrete class instead of the generic 业务 label.
export type ProjtplClass = 'goal' | 'research' | 'workflow'

export const PROJTPL_CLASS_LABEL: Record<ProjtplClass, string> = {
  goal: '目标',
  research: '研究',
  workflow: '工作流',
}

export function projtplClass(item: StoreItem): ProjtplClass {
  const target = item.install?.target ?? ''
  if (/(^|\/)goals?(\/|$)/.test(target)) return 'goal'
  if (/(^|\/)research(\/|$)/.test(target)) return 'research'
  if (/(^|\/)workflows?(\/|$)/.test(target)) return 'workflow'
  // Fall back to the human tags when no install target carries the class.
  const tags = item.tags ?? []
  if (tags.some((t) => /目标|goal/i.test(t))) return 'goal'
  if (tags.some((t) => /研究|调研|research/i.test(t))) return 'research'
  return 'workflow'
}

export const CATEGORY_LABEL: Record<string, string> = {
  design: '设计',
  life: '生活',
  engineering: '工程',
  service: '服务',
  general: '通用',
}

export const ASSET_LABEL: Record<string, string> = {
  brick: '智能原子',
  prompt: '提示词',
  skill: '技能',
  mcp: 'MCP',
  subagent: '子智能体',
  knowledge: '知识库',
  tool: '工具',
}
