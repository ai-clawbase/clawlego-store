/**
 * 资源「最新版本」实时关联——商店与官网同源思路。
 *
 * 官网 (starWeb/starclaw) 通过更新服务 `GET /update/check/clawlego` 拿到桌面端
 * 的 latest_version，再按约定拼出 R2 下载地址。商店对「资源包」做同一件事：
 * `GET /update/check/clawlego-resources` 返回每个组件（clawmod）当前已发布的
 * 最新版本元数据（download_url 指向带版本号的 R2 对象，filename 携带组件自身
 * 版本号）。
 *
 * 这样商店目录里的 version / downloadUrl 不再被 registry 静态构建「冻结」：
 * 每次 publish-resources.sh 发新版后，商店在运行时自动拉到最新版，无需重新
 * 构建 / 部署商店。静态 index.json 退化为「编辑态元数据 + 离线兜底」。
 *
 * 关联键：更新服务组件的 `resource_family`（如 `mod_album`）⟷ 商店条目安装
 * 地址里的 `mods/<family>/` 路径段。
 */
import type { InstallSpec, StoreItem } from '../types'

export const CLAWLEGO_RESOURCES_CHECK_URL =
  import.meta.env.VITE_CLAWLEGO_RESOURCES_CHECK_URL ||
  'https://update.clawlego.com/check/clawlego-resources'

/** 更新服务单条组件记录（/update/check 返回的 components[] 元素）。 */
interface UpdateComponent {
  id: string
  resource_kind?: string | null
  resource_family?: string | null
  filename?: string | null
  download_url?: string | null
  legacy_download_url?: string | null
  sha256?: string | null
  size_bytes?: number | null
}

/** 关联后落到商店条目上的「最新版」字段。 */
export interface LatestResource {
  family: string
  /** 组件自身版本（从 filename 解析，如 mod_album-1.2.0.clawmod → 1.2.0）。 */
  version: string
  /** 带版本号的 R2 下载地址（权威「最新」）。 */
  downloadUrl: string
  filename: string
  sha256: string | null
  sizeBytes: number | null
}

/**
 * 从组件文件名解析其自身版本号：`<family>-<x.y.z>.<ext>`。
 * 解析失败回退空串，由调用方决定是否沿用静态版本。
 */
function versionFromFilename(filename: string, family: string): string {
  const base = filename.replace(/\.(clawmod|clawtpl|clawbrick|clawpkg|tgz|tar\.gz|zip)$/i, '')
  const prefix = `${family}-`
  if (base.startsWith(prefix)) return base.slice(prefix.length)
  const m = base.match(/-(\d+(?:\.\d+)*(?:[-+][0-9A-Za-z.]+)?)$/)
  return m ? m[1] : ''
}

/** 托管资源包的 R2 路径前缀（与 publish-resources.sh 的落盘布局一致）。 */
const RESOURCE_PATH_RE = /\/(?:mods|tpls|bricks|pkgs)\/([^/]+)\//
/** 走更新服务关联「最新版」的 hosted 包安装类型。 */
const PACKAGE_INSTALL_TYPES = new Set(['clawmod', 'clawtpl', 'clawbrick', 'clawpkg'])

/** 从 R2 地址 / 安装地址里抽出 `mods|tpls|bricks|pkgs/<family>/` 的 family 段。 */
export function familyFromUrl(url: string | null | undefined): string {
  if (!url) return ''
  const m = url.match(RESOURCE_PATH_RE)
  return m ? m[1] : ''
}

/** 商店条目对应的资源 family（hosted clawmod/clawtpl/… 才有意义）。 */
export function familyOfItem(item: Pick<StoreItem, 'install' | 'downloadUrl'>): string {
  if (!item.install?.type || !PACKAGE_INSTALL_TYPES.has(item.install.type)) return ''
  return familyFromUrl(item.install?.url) || familyFromUrl(item.downloadUrl)
}

let cache: Promise<Map<string, LatestResource>> | null = null

/**
 * 拉取并缓存「family → 最新版」映射。模块级缓存：StoreView 与 ItemView 共用
 * 一次网络请求。失败时返回空 Map（调用方据此保留静态版本兜底），不抛出。
 */
export function fetchLatestResources(signal?: AbortSignal): Promise<Map<string, LatestResource>> {
  if (cache) return cache
  cache = (async () => {
    const out = new Map<string, LatestResource>()
    try {
      const res = await fetch(`${CLAWLEGO_RESOURCES_CHECK_URL}?current_version=0.0.0`, {
        signal,
        cache: 'no-store',
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const payload = (await res.json()) as { components?: UpdateComponent[] }
      for (const comp of payload.components ?? []) {
        const family = comp.resource_family || familyFromUrl(comp.download_url)
        const downloadUrl = comp.download_url || comp.legacy_download_url
        if (!family || !downloadUrl) continue
        const filename = comp.filename || downloadUrl.split('/').pop() || ''
        out.set(family, {
          family,
          version: versionFromFilename(filename, family),
          downloadUrl,
          filename,
          sha256: comp.sha256 ?? null,
          sizeBytes: comp.size_bytes ?? null,
        })
      }
    } catch {
      // 更新服务不可达：返回空映射，商店沿用静态 index.json 的版本与地址。
    }
    return out
  })()
  return cache
}

/** 测试 / 强制刷新用：清掉模块级缓存。 */
export function resetLatestResourcesCache(): void {
  cache = null
}

/**
 * 把「最新版」覆盖到单个商店条目上（version / downloadUrl / install.url /
 * install.artifact / bundleBytes）。非 hosted-clawmod、或更新服务里没有对应
 * family、或版本未变时原样返回。返回新对象，不改入参。
 */
export function withLatestResource(item: StoreItem, latest: Map<string, LatestResource>): StoreItem {
  const family = familyOfItem(item)
  if (!family) return item
  const hit = latest.get(family)
  if (!hit) return item
  if (hit.downloadUrl === item.downloadUrl && (!hit.version || hit.version === item.version)) {
    return item
  }
  const install: InstallSpec | null = item.install
    ? { ...item.install, url: hit.downloadUrl, artifact: hit.filename || item.install.artifact }
    : item.install
  return {
    ...item,
    version: hit.version || item.version,
    downloadUrl: hit.downloadUrl,
    bundleBytes: hit.sizeBytes ?? item.bundleBytes,
    install,
  }
}

/** 批量覆盖：用于商店目录列表。 */
export function withLatestResources(items: StoreItem[], latest: Map<string, LatestResource>): StoreItem[] {
  if (latest.size === 0) return items
  return items.map((it) => withLatestResource(it, latest))
}
