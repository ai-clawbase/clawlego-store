# ClawLego 商店 · clawlego-store

> 智能资产的开放注册表，浏览站点托管在 [store.clawlego.com](https://store.clawlego.com)

本仓库既是商店的数据，也是它的浏览站点：

- `registry/` —— 商店所有条目的唯一事实来源（人手工编辑）。
- `src/` —— Vue 3 浏览前端，构建产物部署到 Cloudflare。
- `scripts/build-store.mjs` —— 把 `registry/` 编译成 `/store/` 目录 API，供 ClawLego 客户端读取。

## 商店里有什么

条目按 `kind`（类型）划分：

| kind | 含义 |
|---|---|
| `smartspace` | 智能文件夹 —— 给一个目录套上模板，使其可检索、可问答、可整理 |
| `pkg` | ClawPkg 智能体包 —— 开箱即用的完整实例 |
| `tpl` | ClawTpl 智能体模板 —— 人格 + 默认资产配置 |
| `mod` | ClawMod 智能组件 —— 多个资产的可整体安装单元 |
| `projtpl` | 项目模板 —— 声明式的目标 / 工作流脚手架 |
| `brick` | ClawBrick 智能原子 —— 单件资产（提示词 / 技能 / 知识库等） |

另有正交的 `source` 维度：条目源文件要么**托管在本仓库**（`hosted`），要么**从上游 Git 仓库拉取**（`reference`）。

## 仓库与客户端之间的契约

构建脚本把 `registry/` 编译成 `/store/` 目录，部署后由 ClawLego 客户端消费：

```
https://store.clawlego.com/store/index.json            全量目录索引（客户端首先拉取）
https://store.clawlego.com/store/<kind>/<id>/clawasset.json   单条清单
https://store.clawlego.com/store/<kind>/<id>/bundle.tgz  可安装载荷（hosted 条目）
```

- `hosted` 条目的可安装产物是 `bundle.tgz`，由其 `files/` 目录打包而来。
- `reference` 条目在 `clawasset.json` 的 `install.url` 声明上游仓库。
- `/store/*` 开启了 CORS，可跨域读取。

清单字段的完整规范见 [`registry/SCHEMA.md`](./registry/SCHEMA.md)。

商店被桌面 App 内嵌时，浏览页里的「安装」按钮会通过 `postMessage` 把安装意图
交给宿主完成**一键安装**（而非让用户回客户端自己识别查找）。消息协议见
[`EMBED.md`](./EMBED.md)。

除了上面的 HTTP 目录，本仓库**自身也是一个可按 git 仓库识别的 clawlego 市场**
（类似 CC / Codex 插件市场）：clone 下来读 `.clawlego/marketplace.json`，即可直接
从工作树安装条目，可 fork、可自建。规范见 [`MARKETPLACE.md`](./MARKETPLACE.md)。

## 目录结构

```
clawlego-store/
├── registry/              商店数据（唯一事实来源，人手工编辑）
│   ├── SCHEMA.md          条目规范
│   └── <kind>/<id>/       clawasset.json + 可选 README.md + files/
├── scripts/build-store.mjs  扫描 registry/ → 生成 /store/
├── src/                   Vue 3 浏览前端
└── wrangler.jsonc         Cloudflare 部署配置
```

## 开发

```bash
pnpm install
pnpm dev          # 本地开发，http://127.0.0.1:4183
pnpm build        # 类型检查 + 构建站点 + 生成 dist/store/
pnpm preview      # 预览构建产物
pnpm store:check  # 只校验 registry/ 是否合法
pnpm store:build  # 只重新生成 dist/store/
```

`pnpm dev` 会先把目录生成到 `public/store/`（已 gitignore）供本地前端读取。

## 新增一个条目

1. 在 `registry/<kind>/` 下新建文件夹，文件夹名即条目 `id`。
2. 写 `clawasset.json`（字段见 `registry/SCHEMA.md`）。
   - `hosted`：把要分发的源文件放进 `files/`。
   - `reference`：在 `install.url` 填上游仓库地址。
3. `pnpm store:check` 本地校验。

## 部署

部署到 Cloudflare（Workers 静态资源，自定义域名 `store.clawlego.com`）：

```bash
pnpm build
npx wrangler deploy
```

## 许可

MIT，见 [LICENSE](./LICENSE)。`registry/` 下的条目可在各自 `clawasset.json` 中声明独立许可；引用条目以上游仓库许可为准。
