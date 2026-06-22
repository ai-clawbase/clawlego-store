/**
 * 一键安装桥。
 *
 * 商店被宿主桌面 App（ClawLego）以 iframe 嵌入时，条目页与卡片
 * 上的「安装」按钮不再只是「告诉用户去客户端里自己找、自己识别」，而是把
 * 安装意图直接 postMessage 给宿主——由宿主把资产解压（hosted）或从上游拉取
 * （reference）进当前实例的文件树。这才是真正的一键安装。
 *
 * 普通浏览器环境（store.clawlego.com）下没有宿主，安装按钮回退为原有的手动
 * 下载 bundle.tgz / 打开上游仓库；本模块完全不介入。
 *
 * ── 三态按钮（安装 / 已安装 / 升级）─────────────────────────────────────
 * 嵌入时，宿主在握手（ready）回传当前实例「已安装清单」——每条带 `version`，
 * 即已落地到文件树里的那份智能文件夹 / 资产的版本元数据。商店据此把按钮渲染成：
 *   - 未装             → 安装
 *   - 已装且版本 ≥ 商店 → 已安装（不可点）
 *   - 已装但版本 < 商店 → 升级（可点，再次安装即覆盖升级）
 *
 * ── 协议 ──────────────────────────────────────────────────────────────
 * store → host：
 *   { source: 'clawlego-store', type: 'ready' }                      // 就绪握手
 *   { source: 'clawlego-store', type: 'install', requestId, item }   // 安装请求
 * host → store：
 *   { source: 'clawlego-host', type: 'installed', items: [{ kind, id, version }] }
 *   { source: 'clawlego-host', type: 'install-status', kind, id, status, version?, message? }
 *
 * `item` 已替宿主把相对地址解析为绝对地址、把 install.target 里的 `{id}`
 * 占位符填好，宿主拿到即可直接执行，无需再回查 index.json。
 */
import { reactive } from 'vue'
import { MESSAGE_SOURCE, isEmbedded } from './embed'
import type { InstallSpec, StoreItem } from './types'

const HOST_SOURCE = 'clawlego-host'

/** 按钮的有效语义状态——由瞬时动作状态与已安装版本共同推导。 */
export type InstallAction = 'idle' | 'installing' | 'installed' | 'upgradable' | 'error'

export interface InstallView {
  action: InstallAction
  /** 当前实例里已安装的版本（已安装 / 可升级时存在）。 */
  installedVersion?: string
  message?: string
}

/** 瞬时动作状态（安装中 / 失败），按 `${kind}/${id}` 索引；reactive 驱动 UI。 */
const transient = reactive<Record<string, { status: 'installing' | 'error'; message?: string }>>({})
/** 当前实例已安装版本，按 `${kind}/${id}` 索引；来自宿主握手或本次安装成功。 */
const installedVersions = reactive<Record<string, string>>({})
/** 发起安装时记下请求的版本，宿主回传不带 version 时用它兜底（非响应式）。 */
const pendingVersions: Record<string, string> = {}

function keyOf(kind: string, id: string): string {
  return `${kind}/${id}`
}

/**
 * 比较两个版本号（形如 `1.2.0` / `v0.3`）。返回 -1 / 0 / 1。
 * 逐段数值比较，非数值段退回字典序——足以驱动「是否有更新」的判断。
 */
function compareVersions(a: string, b: string): number {
  const pa = a.replace(/^v/i, '').split('.')
  const pb = b.replace(/^v/i, '').split('.')
  const n = Math.max(pa.length, pb.length)
  for (let i = 0; i < n; i++) {
    const da = pa[i] ?? '0'
    const db = pb[i] ?? '0'
    const na = parseInt(da, 10)
    const nb = parseInt(db, 10)
    if (!Number.isNaN(na) && !Number.isNaN(nb)) {
      if (na !== nb) return na < nb ? -1 : 1
      if (da !== db) return da < db ? -1 : 1 // 同数值不同后缀（1.0.0-beta）
    } else {
      const c = da.localeCompare(db)
      if (c !== 0) return c < 0 ? -1 : 1
    }
  }
  return 0
}

/** 已装版本严格落后于商店版本时才算「可升级」；版本缺失则保守视为已安装。 */
function isUpgrade(installed: string, current: string): boolean {
  if (!installed || !current) return false
  return compareVersions(installed, current) < 0
}

/** 响应式读取某条目相对当前实例的安装视图（未嵌入 / 未知条目即 idle）。 */
export function installState(item: StoreItem): InstallView {
  const key = keyOf(item.kind, item.id)
  const t = transient[key]
  if (t?.status === 'installing') return { action: 'installing' }
  if (t?.status === 'error') return { action: 'error', message: t.message }
  const iv = installedVersions[key]
  if (iv !== undefined) {
    return isUpgrade(iv, item.version)
      ? { action: 'upgradable', installedVersion: iv }
      : { action: 'installed', installedVersion: iv }
  }
  return { action: 'idle' }
}

/** 当前是否支持一键安装——即被宿主桌面 App 嵌入。 */
export function canInstall(): boolean {
  return isEmbedded()
}

function toAbsolute(url: string | null): string | null {
  if (!url) return url
  try {
    return new URL(url, window.location.origin).href
  } catch {
    return url
  }
}

function resolveInstall(item: StoreItem): InstallSpec | null {
  const ins = item.install
  if (!ins) return null
  return ins.target ? { ...ins, target: ins.target.replace('{id}', item.id) } : ins
}

let seq = 0

/**
 * 请求宿主安装某条目（首装或升级覆盖）。仅在嵌入态发出；安装中 / 已是最新
 * （已安装）会被忽略，「升级」与「失败重试」则放行。返回是否真正发出请求。
 */
export function requestInstall(item: StoreItem): boolean {
  if (!isEmbedded()) return false

  const key = keyOf(item.kind, item.id)
  const action = installState(item).action
  if (action === 'installing' || action === 'installed') return false

  pendingVersions[key] = item.version
  transient[key] = { status: 'installing' }

  window.parent.postMessage(
    {
      source: MESSAGE_SOURCE,
      type: 'install',
      requestId: `${Date.now()}-${++seq}`,
      item: {
        id: item.id,
        kind: item.kind,
        source: item.source,
        name: item.name,
        version: item.version,
        downloadUrl: toAbsolute(item.downloadUrl),
        detailUrl: toAbsolute(item.detailUrl),
        homepage: item.homepage,
        install: resolveInstall(item),
      },
    },
    '*',
  )
  return true
}

function markInstalled(kind: string, id: string, version: string): void {
  if (!kind || !id) return
  const key = keyOf(kind, id)
  installedVersions[key] = version
  delete transient[key]
}

/**
 * 初始化安装桥：监听宿主回传的状态，并在就绪时握手索要「已安装」清单
 * （用于初次渲染就把已装条目标成「已安装 / 升级」）。非嵌入态为空操作。
 */
export function initInstallBridge(): void {
  if (!isEmbedded()) return

  window.addEventListener('message', (event: MessageEvent) => {
    const data = event.data
    if (!data || typeof data !== 'object' || data.source !== HOST_SOURCE) return

    if (data.type === 'install-status') {
      const kind = String(data.kind ?? '')
      const id = String(data.id ?? '')
      if (!kind || !id) return
      const key = keyOf(kind, id)
      switch (data.status) {
        case 'installed':
          markInstalled(kind, id, String(data.version ?? pendingVersions[key] ?? ''))
          break
        case 'installing':
          transient[key] = { status: 'installing' }
          break
        case 'error':
          transient[key] = { status: 'error', message: data.message }
          break
        case 'idle':
          delete transient[key]
          break
      }
      return
    }

    if (data.type === 'installed' && Array.isArray(data.items)) {
      for (const it of data.items) {
        if (it && it.kind && it.id) {
          installedVersions[keyOf(String(it.kind), String(it.id))] = String(it.version ?? '')
        }
      }
    }
  })

  try {
    window.parent.postMessage({ source: MESSAGE_SOURCE, type: 'ready' }, '*')
  } catch {
    /* 跨域 / 无父窗口：忽略，安装请求时仍会尝试 postMessage。 */
  }
}
