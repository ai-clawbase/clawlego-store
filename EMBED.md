# 嵌入协议 · clawlego-store ⇄ 宿主桌面 App

商店站点（`store.clawlego.com`）可被 ClawLego 桌面 App 以 iframe
方式内嵌。内嵌时，前端通过 `window.postMessage` 与宿主双向通信，把「浏览 →
**一键安装**」这条链路闭合在商店页里，而不是让用户回到客户端自己识别、查找、
再安装。

非嵌入态（普通浏览器）下，前端不发任何消息，安装按钮回退为手动下载
`bundle.tgz` / 打开上游仓库。

所有消息都是普通对象，靠 `source` 字段区分方向：

- 商店发出的消息：`source: 'clawlego-store'`
- 宿主发出的消息：`source: 'clawlego-host'`

宿主收到 `clawlego-store` 消息时，**务必先校验 `event.origin`** 是本商店域名。

实现见 [`src/embed.ts`](./src/embed.ts)（外链）与 [`src/install.ts`](./src/install.ts)（安装）。

## store → host

### `ready` — 就绪握手

商店加载完成后发出一次。宿主可借此回传 `installed` 清单，让已安装条目初次
渲染就显示「已安装」。

```json
{ "source": "clawlego-store", "type": "ready" }
```

### `open-external` — 打开外链

跨域外链（官网 / 仓库 / 下载）点击会被接管，交由宿主用系统浏览器打开
（WKWebView 无 UIDelegate 时会静默吞掉 `target="_blank"`）。

```json
{ "source": "clawlego-store", "type": "open-external", "url": "https://…" }
```

### `install` — 安装请求

点击「安装」时发出。`item` 已替宿主把相对地址解析为绝对地址、把
`install.target` 里的 `{id}` 占位符填好——宿主拿到即可直接执行，无需回查
`index.json`。

```json
{
  "source": "clawlego-store",
  "type": "install",
  "requestId": "1718900000000-1",
  "item": {
    "id": "clawmod-xxx",
    "kind": "mod",
    "source": "hosted",
    "name": "示例组件",
    "version": "1.0.0",
    "downloadUrl": "https://store.clawlego.com/store/mod/clawmod-xxx/bundle.tgz",
    "detailUrl": "https://store.clawlego.com/store/mod/clawmod-xxx/clawasset.json",
    "homepage": null,
    "install": {
      "type": "tarball",
      "artifact": "bundle.tgz",
      "target": "business/assets/mods/clawmod-xxx"
    }
  }
}
```

宿主据此安装到当前实例的文件树：

- `source: "hosted"` → 下载 `downloadUrl` 的 tarball，解压到 `install.target`。
- `source: "reference"` → 按 `install.{url,ref,subdir}` 从上游仓库拉取到
  `install.target`。

## host → store

宿主回传安装状态，驱动按钮显示「安装中… / 已安装 / 安装失败 · 重试」。

### `installed` — 已安装清单

通常在收到 `ready` 后回传，也可在安装完成后随时再发。

```json
{
  "source": "clawlego-host",
  "type": "installed",
  "items": [ { "kind": "mod", "id": "clawmod-xxx" } ]
}
```

### `install-status` — 单条状态变更

```json
{
  "source": "clawlego-host",
  "type": "install-status",
  "kind": "mod",
  "id": "clawmod-xxx",
  "status": "installed",
  "message": "可选，error 时用于展示原因"
}
```

`status` 取值：`installing` | `installed` | `error` | `idle`。

> 商店发起 `install` 时会先本地乐观置为 `installing`；宿主**应当**在成功或
> 失败时回一条 `install-status`，否则按钮会一直停在「安装中…」。
