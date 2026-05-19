/**
 * 嵌入桥。
 *
 * 当商店被宿主 App（如 StarClaw3）以 iframe 方式嵌入时，外层 webview
 * 往往无法处理 `target="_blank"` 外链——例如 macOS 的 WKWebView 在没有
 * UIDelegate 时会静默丢弃新窗口请求，于是「官网 / 开源仓库 / 下载」点了
 * 毫无反应。
 *
 * 这里在「检测到自己被嵌入」时接管跨域外链点击：阻止默认行为，改用
 * postMessage 通知父窗口，由宿主调系统浏览器打开。普通浏览器环境下
 * 不安装任何监听，行为完全不变。
 *
 * 宿主侧约定：监听 message，校验 `event.origin` 为本商店域名后，
 * 处理 `{ source: 'clawlego-store', type: 'open-external', url }`。
 */

const MESSAGE_SOURCE = 'clawlego-store'

/** 是否运行在 iframe 中（含跨域嵌入——跨域访问 window.top 会抛异常）。 */
function isEmbedded(): boolean {
  try {
    return window.top !== window.self
  } catch {
    return true
  }
}

export function installEmbedBridge(): void {
  if (!isEmbedded()) return

  document.addEventListener(
    'click',
    (event) => {
      // 让出已被处理的点击、非主键点击、以及带修饰键的「在新标签打开」。
      if (event.defaultPrevented || event.button !== 0) return
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return

      const anchor = (event.target as HTMLElement | null)?.closest('a')
      if (!anchor || !/^https?:/i.test(anchor.href)) return

      let url: URL
      try {
        url = new URL(anchor.href)
      } catch {
        return
      }
      // 只接管跨域外链；站内路由与同源资源（如 bundle.tgz 下载）保持原样。
      if (url.origin === window.location.origin) return

      event.preventDefault()
      window.parent.postMessage(
        { source: MESSAGE_SOURCE, type: 'open-external', url: url.href },
        '*',
      )
    },
    true,
  )
}
