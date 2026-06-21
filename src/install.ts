/**
 * 一键安装桥。
 *
 * 商店被宿主桌面 App（ClawLego / StarClaw3）以 iframe 嵌入时，条目页与卡片
 * 上的「安装」按钮不再只是「告诉用户去客户端里自己找、自己识别」，而是把
 * 安装意图直接 postMessage 给宿主——由宿主把资产解压（hosted）或从上游拉取
 * （reference）进当前实例的文件树。这才是真正的一键安装。
 *
 * 普通浏览器环境（store.clawlego.com）下没有宿主，安装按钮回退为原有的手动
 * 下载 bundle.tgz / 打开上游仓库；本模块完全不介入。
 *
 * ── 协议 ──────────────────────────────────────────────────────────────
 * store → host：
 *   { source: 'clawlego-store', type: 'ready' }                      // 就绪握手
 *   { source: 'clawlego-store', type: 'install', requestId, item }   // 安装请求
 * host → store：
 *   { source: 'clawlego-host', type: 'installed', items: [{ kind, id }] }
 *   { source: 'clawlego-host', type: 'install-status', kind, id, status, message? }
 *
 * `item` 已替宿主把相对地址解析为绝对地址、把 install.target 里的 `{id}`
 * 占位符填好，宿主拿到即可直接执行，无需再回查 index.json。
 */
import { reactive } from 'vue'
import { MESSAGE_SOURCE, isEmbedded } from './embed'
import type { InstallSpec, StoreItem } from './types'

const HOST_SOURCE = 'clawlego-host'

export type InstallStatus = 'idle' | 'installing' | 'installed' | 'error'

export interface InstallEntry {
  status: InstallStatus
  message?: string
}

const IDLE: InstallEntry = { status: 'idle' }

/** 按 `${kind}/${id}` 索引的安装状态；reactive 以驱动 UI。 */
const states = reactive<Record<string, InstallEntry>>({})

function keyOf(kind: string, id: string): string {
  return `${kind}/${id}`
}

/** 响应式读取某条目的安装状态（未知条目返回 idle）。 */
export function installState(kind: string, id: string): InstallEntry {
  return states[keyOf(kind, id)] ?? IDLE
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
 * 请求宿主安装某条目。仅在嵌入态发出；重复点击（安装中 / 已安装）会被忽略。
 * 返回是否真正发出了请求。
 */
export function requestInstall(item: StoreItem): boolean {
  if (!isEmbedded()) return false

  const key = keyOf(item.kind, item.id)
  const current = states[key]?.status
  if (current === 'installing' || current === 'installed') return false

  states[key] = { status: 'installing' }

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

function applyStatus(kind: string, id: string, status: InstallStatus, message?: string): void {
  if (!kind || !id) return
  states[keyOf(kind, id)] = { status, message }
}

/**
 * 初始化安装桥：监听宿主回传的状态，并在就绪时握手索要「已安装」清单
 * （用于初次渲染就把已装条目标成「已安装」）。非嵌入态为空操作。
 */
export function initInstallBridge(): void {
  if (!isEmbedded()) return

  window.addEventListener('message', (event: MessageEvent) => {
    const data = event.data
    if (!data || typeof data !== 'object' || data.source !== HOST_SOURCE) return

    if (data.type === 'install-status') {
      const s = data.status
      if (s === 'idle' || s === 'installing' || s === 'installed' || s === 'error') {
        applyStatus(String(data.kind ?? ''), String(data.id ?? ''), s, data.message)
      }
      return
    }

    if (data.type === 'installed' && Array.isArray(data.items)) {
      for (const it of data.items) {
        if (it && it.kind && it.id) applyStatus(String(it.kind), String(it.id), 'installed')
      }
    }
  })

  try {
    window.parent.postMessage({ source: MESSAGE_SOURCE, type: 'ready' }, '*')
  } catch {
    /* 跨域 / 无父窗口：忽略，安装请求时仍会尝试 postMessage。 */
  }
}
