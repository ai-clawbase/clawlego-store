# CLAUDE.md

本文件指导 Claude Code 在本仓库工作。

## 这是什么

`clawlego-store` 是 ClawLego 商店——一个**既是数据、又是站点**的开源仓库：

- `registry/` 是商店所有条目的唯一事实来源（人手工编辑的数据）。
- `src/` 是浏览前端（Vue 3 + Vite + TS），构建后部署到 Cloudflare Pages。
- `scripts/build-store.mjs` 把 `registry/` 编译成 `/store/` 目录——ClawLego
  软件读取的目录 API。

商店条目由两个正交维度描述：

- **`kind`（粒度）**——三级聚合:原子资产（`prompt` / `skill`）→ `mod`（资产包）
  → `tpl`（完整智能体）。
- **`source`（来源）**——`hosted`（源文件托管在本仓库）或 `reference`（从上游
  GitHub 仓库拉取）。任何粒度都可以是任一来源；"来自 GitHub" 是来源，不是一类资产。

## 命令

```bash
pnpm install
pnpm dev          # 开发服务器，127.0.0.1:4183（会先生成 public/store/）
pnpm build        # vue-tsc 类型检查 + vite build + 生成 dist/store/
pnpm preview      # 预览构建产物
pnpm store:check  # 只校验 registry/ 是否合法
```

无测试运行器；类型检查随 `pnpm build` 执行。

## 架构

**契约优先。** 仓库与 ClawLego 软件之间的接口是 `/store/` 下的 JSON 与 tarball。
改动 `clawasset.json` 字段、`build-store.mjs` 的输出结构、或 `index.json` 的形态时，
就是在改这个契约——保持向后兼容，规范见 `registry/SCHEMA.md`。

| 层 | 路径 | 职责 |
|---|---|---|
| 数据 | `registry/{tpl,mod,prompt,skill}/<id>/` | 条目源 —— `clawasset.json` + 可选 `README.md` + `files/` |
| 构建 | `scripts/build-store.mjs` | 扫描并校验 registry，输出 `<target>/store/` |
| 前端 | `src/views/`、`src/components/` | 浏览站点，运行时 `fetch('/store/...')` |
| 类型 | `src/types.ts` | 前端与 `index.json` 共用的形态定义 |

`build-store.mjs` 不依赖任何 npm 包，用系统 `tar` 打包；它同时是校验器，
registry 不合法会让构建失败。

## 约定

- 这是一个**面向数据的仓库**——大多数日常改动是在 `registry/` 下增删条目，
  而不是改前端。新增条目流程见 `README.md`。
- 中文优先：v1 前端仅中文，界面文案直接写在组件里，未引入 i18n。
- 条目 `id` 必须与文件夹名一致；约定前缀 `clawtpl-` / `clawmod-` / `prompt-` / `skill-`。
- `category` 取值受限：`design` / `life` / `engineering` / `service` / `general`。
- `public/store/` 与 `dist/` 是构建产物，已 gitignore，不要手工编辑或提交。

## 上下文

本仓库归属 GitHub 组织 `ai-clawbase`，与 ClawLego 官网（`ai-clawbase/starclaw-web`）
同组。设计体系（色板、字体、按钮）沿用官网，token 见 `src/styles.css`。
部署目标是 Cloudflare Pages 项目 `clawlego-store` → `store.clawlego.com`。
