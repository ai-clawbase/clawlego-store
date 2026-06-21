# Git 市场 · clawlego marketplace

ClawLego 商店有两条等价的分发通道，**同一份 `registry/` 数据**喂养两者：

| 通道 | 入口 | 适合 |
|---|---|---|
| **HTTP 目录**（CDN） | `https://store.clawlego.com/store/index.json` | 官方商店、快速浏览、桌面 App 内嵌 |
| **Git 市场**（去中心化） | 仓库 clone URL + `.clawlego/marketplace.json` | 像 CC / Codex 插件市场那样「按 git 仓库识别」、可 fork、可自建 |

Git 市场让**任何 git 仓库**都能成为一个 clawlego 市场：客户端拿到仓库地址，
`clone`/`pull` 下来，读 `.clawlego/marketplace.json`，就能发现并安装条目——
条目直接从 clone 出来的**工作树**里装，不依赖任何中台或数据库。这正是
「一切皆文件、围绕 agent」的分发形态。官方仓库只是第一个、而非唯一的市场。

## 客户端如何识别一个市场

```
1. 用户提供仓库地址：  git@github.com:ai-clawbase/clawlego-store.git
2. 客户端 clone / pull 到本地缓存
3. 读 .clawlego/marketplace.json        ← 市场清单（本文件由 build 生成、已提交）
4. 列出 entries[]，按需安装
```

桌面 App 端的「按 git URL 注册市场并安装」识别器在 App 仓库实现（本仓库只负责
生产端：生成清单 + 规范 + 校验）。

## 清单格式 · `.clawlego/marketplace.json`

`registry/` 是唯一事实来源；清单由 `scripts/build-store.mjs` 生成并**提交进仓库**
（无时间戳等易变字段，像 lockfile 一样只在 `registry/` 变动时才变）。

```jsonc
{
  "schema": "clawlego-marketplace/v1",
  "id": "clawlego-store",
  "name": "ClawLego 官方商店",
  "owner": { "name": "ai-clawbase", "url": "https://github.com/ai-clawbase" },
  "site": "https://store.clawlego.com",
  "source": { "type": "git", "url": "…clawlego-store.git", "ref": "main" },
  "count": 24,
  "entries": [
    {
      "id": "clawmod-xxx",
      "kind": "mod",
      "source": "hosted",
      "name": "示例组件",
      "tagline": "一句话简介",
      "version": "1.0.0",
      "category": "general",
      "path": "registry/mod/clawmod-xxx",            // 条目目录（相对仓库根）
      "manifest": "registry/mod/clawmod-xxx/claw.json",
      "install": {
        "type": "files",                              // 从工作树直接装
        "files": "registry/mod/clawmod-xxx/files",    // 拷贝这个目录
        "target": "business/assets/mods/clawmod-xxx"  // 落到实例文件树（{id} 已解析）
      }
    },
    {
      "id": "skill-foo",
      "kind": "brick",
      "source": "reference",
      "install": {
        "type": "git",                                // 从上游仓库拉
        "url": "https://github.com/owner/repo.git",
        "ref": "main",
        "subdir": "skills/foo",
        "target": "business/assets/bricks/skill-foo"
      }
    }
  ]
}
```

### 安装语义

- `install.type: "files"`（`source: hosted`）—— 把 `install.files` 目录的内容拷进
  当前实例的 `install.target`。源文件就在 clone 出来的工作树里，无需 tarball。
- `install.type: "git"`（`source: reference`）—— 按 `install.{url,ref,subdir}` 从上游
  仓库拉取，落到 `install.target`。

`target` 里的 `{id}` 占位符已在生成时解析为真实 id，客户端拿到即可直接用。

## 自建一个市场

1. 建一个 git 仓库，按 `registry/<kind>/<id>/{claw.json, files/}` 放条目
   （规范见 [`registry/SCHEMA.md`](./registry/SCHEMA.md)）。
2. 用本仓库的 `scripts/build-store.mjs --manifest` 生成 `.clawlego/marketplace.json`
   并提交。
3. 把仓库地址给到 ClawLego 即可作为市场被识别。

## 维护（本仓库）

```bash
pnpm store:manifest   # 由 registry/ 重新生成 .clawlego/marketplace.json
pnpm store:check      # 校验 registry/，并检查已提交清单是否过期（CI/提交前用）
pnpm build            # 构建站点 + HTTP 目录，并顺带刷新 git 清单
```

`pnpm store:check` 会在 `.clawlego/marketplace.json` 与 `registry/` 不一致时报错，
提醒你 `pnpm store:manifest` 后再提交，避免清单漂移。
