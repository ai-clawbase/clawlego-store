# ClawLego 商店 · clawlego-store

> 智能资产的开放注册表 —— 浏览站点托管在 [store.clawlego.com](https://store.clawlego.com)

这个仓库**既是数据，也是站点**：

- **数据** —— `registry/` 是商店所有条目的唯一事实来源（人手工编辑）。
- **站点** —— `src/` 是一个 Vue 3 浏览前端；构建产物部署到 Cloudflare Pages。

ClawLego 软件里的「商店」页直接读取本仓库构建出的目录 API，用户点一下「安装」，
源文件就落到自己实例的文件树里。

## 商店里有什么

智能资产分**三级聚合粒度**，由细到粗：

| 粒度 | 含义 |
|---|---|
| **提示词 / 技能** | 单件原子资产——粒度最细，不必装一整个包就能单取 |
| **ClawMod** | 资产包——提示词 / 技能 / MCP / 知识库 / subagent / tools 的可整体安装单元 |
| **ClawTpl** | 出厂模板——一个完整智能体（人格 + 资产 + 引擎偏好的整体声明） |

另有一个**正交的来源维度** `source`：每个条目的源文件要么**托管在本仓库**
（`hosted`），要么**从上游 GitHub 仓库拉取**（`reference`）。"来自 GitHub" 是一种
来源，不是一类资产——任何粒度都可以是任一来源。

## 仓库与软件之间的契约

构建脚本把 `registry/` 编译成 `/store/` 目录，部署后由 ClawLego 客户端消费：

```
https://store.clawlego.com/store/index.json          ← 客户端首先拉取的全量目录
https://store.clawlego.com/store/<kind>/<id>/claw.json   单条清单
https://store.clawlego.com/store/<kind>/<id>/bundle.tgz  可安装载荷（托管条目）
```

- `<kind>` 为 `tpl` / `mod` / `prompt` / `skill`。
- `hosted` 条目的可安装产物是一个 `bundle.tgz`，由 `files/` 目录打包而来。
- `reference` 条目的 `claw.json` 里带 `install.url`，客户端据此从上游 Git 拉取。
- `/store/*` 开启了 CORS，可跨域读取。

条目清单字段的完整规范见 [`registry/SCHEMA.md`](./registry/SCHEMA.md)。

## 目录结构

```
clawlego-store/
├── registry/              商店数据（唯一事实来源，人手工编辑）
│   ├── SCHEMA.md          条目规范
│   ├── tpl/<id>/          ClawTpl —— claw.json + 可选 README.md + files/
│   ├── mod/<id>/          ClawMod —— claw.json + 可选 README.md + files/
│   ├── prompt/<id>/       单件提示词 —— claw.json + 可选 README.md + files/
│   └── skill/<id>/        单件技能 —— claw.json + 可选 README.md + files/
│      （reference 来源的条目不带 files/，在 claw.json 的 install 里声明上游仓库）
├── scripts/
│   └── build-store.mjs    扫描 registry/ → 生成 /store/ 目录
├── src/                   Vue 3 浏览前端
└── .github/workflows/     Cloudflare Pages 部署
```

## 开发

```bash
pnpm install
pnpm dev        # 本地开发，http://127.0.0.1:4183
pnpm build      # 类型检查 + 构建站点 + 生成 /store/ 目录
pnpm preview    # 预览构建产物
```

辅助命令：

```bash
pnpm store:check    # 只校验 registry/ 是否合法（CI 也会跑）
pnpm store:build    # 只重新生成 dist/store/
```

`pnpm dev` 会先把目录生成到 `public/store/`（已 gitignore），供本地前端读取。

## 新增一个商店条目

1. 在 `registry/<kind>/` 下新建文件夹，文件夹名即条目 `id`。
2. 写 `claw.json`（字段见 `registry/SCHEMA.md`）。
   - `source: hosted`：把要分发的源文件放进 `files/`。
   - `source: reference`：在 `install.url` 填上游仓库地址。
3. `pnpm store:check` 本地校验。
4. 提交 PR。合并到 `main` 后，GitHub Actions 自动构建并部署到 Cloudflare Pages。

## 部署

`main` 分支每次推送由 `.github/workflows/deploy.yml` 自动部署到 Cloudflare Pages
项目 `clawlego-store`。需要在仓库 Secrets 配置 `CLOUDFLARE_API_TOKEN`。

## 许可

MIT，见 [LICENSE](./LICENSE)。`registry/` 下的条目可在各自 `claw.json` 中声明
独立许可；引用条目的内容以上游仓库的许可为准。
