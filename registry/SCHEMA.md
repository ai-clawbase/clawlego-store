# 商店注册表规范（registry schema）

`registry/` 是商店的**唯一事实来源**。所有条目由人手工编辑，`scripts/build-store.mjs`
扫描这里，生成 ClawLego 软件消费的 `/store/` 目录。

## 两个正交的维度

每个条目由两个独立的维度描述：

- **`kind`（粒度 / 类型）** —— 由细到粗的四级聚合阶梯：
  `brick`（原子积木）→ `mod`（功能组件）→ `tpl`（角色模版）→ `pkg`（智能体包）；
  外加两个**按用途浏览**的目录（不在阶梯上，用户按名字找而非按粒度）：
  `smartspace`（智能文件夹）与 `projtpl`（项目模板）。
- **`source`（来源）** —— 源文件托管在哪：`hosted`（本仓库托管）或
  `reference`（从上游 Git 仓库拉取）。

## 目录约定

```
registry/
├── brick/<id>/        ClawBrick —— 原子积木（提示词、技能、知识库等单件资产）
├── mod/<id>/          ClawMod —— 功能组件（多个积木的有机组合）
├── tpl/<id>/          ClawTpl —— 角色模版（人格声明 + 默认资产配置）
├── pkg/<id>/          ClawPkg —— 智能体包（开箱即用的完整工作空间，含数据与流程）
├── smartspace/<id>/  智能文件夹 —— 一个 SmartSpace kind 包（system/smartspace/kinds/<kind>/ 目录树）
└── projtpl/<id>/       项目模板 —— 声明式行为模板（目标 / 工作流 / 研究脚手架，落在 business/ 下）
```

- `<id>` 即文件夹名，必须与 `clawasset.json` 里的 `id` 一致。
- 约定前缀：`prompt-*` / `skill-*` / `clawmod-*` / `clawtpl-*` / `clawpkg-*` /
  `smartspace-*` / `projtpl-*`。

## 每个条目的结构

条目要带哪些文件，取决于 `source`：

| 文件 | `source: hosted` | `source: reference` | 说明 |
|---|:--:|:--:|---|
| `clawasset.json`  | ✓ | ✓ | 清单（必需） |
| `README.md`  | 可选 | 可选 | 长描述，随条目发布 |
| `files/`     | ✓ | – | 被托管的源文件树，构建时整体打成 `bundle.tgz` |

- `hosted` 条目把要分发的源文件放进 `files/`：
  - `brick` —— 单个资产文件（如 `SKILL.md` 或提示词 `.md`）。
  - `mod` —— 资产按 `prompts/` `skills/` `mcp/` `knowledge/` 等子目录组织。
  - `tpl` —— 包含 `agent.json` 等配置的模版文件。
  - `pkg` —— 完整的实例目录树（不含用户私密数据）。
  - `smartspace` —— 一个 SmartSpace kind 目录的内容（`manifest.yaml` + `about.md` +
    `prompts/cmd_*.md` + `.source`）。`install.target` 写
    `system/smartspace/kinds/<kind>`（kind slug 即 manifest.yaml 的 `metadata.name`）。
  - `projtpl` —— 一个行为模板目录的内容：工作流 `WORKFLOW.md`，或目标
    `GOAL.md` + `success.md` + `example_plan.md`。`install.target` 写
    `business/workflows/<slug>` 或 `business/goals/<slug>`。
- `reference` 条目不带 `files/`，改在 `install` 里声明上游 Git 仓库。

## `clawasset.json` 字段

| 字段 | 必需 | 说明 |
|---|:--:|---|
| `id` | ✓ | 与文件夹同名 |
| `kind` | ✓ | `brick` \| `mod` \| `tpl` \| `pkg` \| `smartspace` \| `projtpl` |
| `source` | ✓ | `hosted` \| `reference` |
| `name` | ✓ | 显示名 |
| `tagline` | ✓ | 一句话副标题 |
| `summary` |  | 详细描述（商店详情页用） |
| `version` | ✓ | 语义化版本 |
| `category` | ✓ | `design` \| `life` \| `engineering` \| `service` \| `general` |
| `tags` |  | 标签数组 |
| `icon` |  | Iconify 图标名 |
| `accent` |  | 主题色 |
| `author` |  | `{ name, url }` |
| `license` |  | 许可 |
| `contents` |  | 资产计数 `{ prompt, skill, mcp, subagent, knowledge, tool }`；`brick` 条目通常省略 |
| `install` |  | 安装信息，见下 |
| `artifact` |  | R2-hosted 官方条目的 clawasset 绑定 `{ asset, id, type }`，见「`artifact` 绑定」 |
| `updated` |  | `YYYY-MM-DD`，用于排序 |

### `install` 字段

**`source: hosted`** —— 构建脚本会自动补全 `type`（`tarball`）/ `artifact`
（`bundle.tgz`）。

- `brick`：可省略 `install`——构建脚本会把 `target` 自动推导为 `business/assets/bricks/{id}`。
- `mod` / `tpl` / `pkg`：通常需要显式写 `target`，例如：
  - `pkg` 的 target 通常是 `business/instances/{id}`。

**`source: reference`** —— 必须声明上游 Git 仓库：

```json
{
  "type": "git",
  "url": "https://github.com/owner/repo.git",
  "ref": "main",
  "subdir": "",
  "target": "business/assets/mods/{id}"
}
```

**`source: hosted` 且托管在 R2（官方包推荐）** —— 不在本仓库放 `files/`，改用
对象存储托管 bundle，仓库只留 `clawasset.json` 元数据。适合体量大、不宜把源码开源
对外的官方智能文件夹包 / 模板包：构建脚本检测到「`hosted` 但没有 `files/`，且
`install.url` 是绝对 https 地址」时，跳过本地打包，直接把该地址作为
`downloadUrl` 透传进目录。

```json
{
  "type": "clawmod",
  "url": "https://download.clawlego.com/mods/<artifact-id>/<version>/<artifact-id>-<version>.clawmod",
  "target": "system/smartspace/kinds/<kind>"
}
```

- `type`：`tarball`（解压进 `target`，用于自包含的智能文件夹 kind 包）或
  `clawmod`（走 pkgmanager 安装、记录 owned-files，卸载更干净，用于完整 mod；
  `target` 可省，路径由包内 manifest 声明）。
- `url`：必须是 `download.clawlego.com` 上的绝对 https 地址（公开可读 R2）。
  这是 starclaw3 发布管线产出的真实布局：mod →
  `mods/<artifact-id>/<version>/<artifact-id>-<version>.clawmod`（另有版本无关别名
  `mods/<artifact-id>/<artifact-id>.clawmod`）；tpl →
  `tpls/<artifact-id>/<version>/<artifact-id>-<version>.clawtpl`。`<artifact-id>` 是
  clawassets 包自身的 id（如 `mod_note_vault`），可与本条目的 `id` 不同。
- bundle 由 starclaw3 发布管线（`scripts/release-resources.sh` 构建 .clawmod/.clawtpl
  → `scripts/publish-resources.sh --clawmods --clawtpls` 上传 R2）产出；本仓库只提交
  `clawasset.json`，不放 `files/`。

### `artifact` 绑定（R2-hosted 官方条目专用）

R2-hosted 条目的 `version` 与 `install.url` 是**技术事实**，由 starclaw3 那边的
clawasset 包决定，不该在商店里手抄（会随包升级漂移）。所以官方 R2-hosted 条目在
`clawasset.json` 顶层声明一个 `artifact` 绑定，指明它背后是哪个 clawasset 包：

```json
"artifact": {
  "asset": "mod",          // clawassets/<asset>s/ 目录：mod | tpl | pkg
  "id": "mod_note_vault",  // clawasset 包自身的 id（可与本条目 id 不同）
  "type": "clawmod"        // 实例侧安装方式：clawmod | clawtpl | tarball
}
```

**分工**：商店 registry 永远是**展示元数据**（name / tagline / icon / accent /
category / summary / tags）的唯一事实源——`artifact` 绑定**不碰**这些字段。
starclaw3 的桥接脚本 `scripts/bridge-store-metadata.py` 读取每个带 `artifact` 的条目，
从对应 clawasset 包的 manifest 解析当前 `version`，按上面的 R2 布局算出 `install.url`，
把条目刷成 R2-hosted（`source: hosted`、`install: {type,url}`、删掉 `files/`），
**只写 `version` / `install` 两项**。包升级后重跑桥接即可同步；
`bridge-store-metadata.py --check` 会在 store 落后于 clawasset 版本时报错（类似 manifest 陈旧检查）。

## 构建产物（`/store/`）

```
/store/index.json                全量目录索引 —— ClawLego 首先拉取这个
/store/<kind>/<id>/clawasset.json      补全后的单条清单
/store/<kind>/<id>/bundle.tgz     可安装载荷（仅 repo-hosted 条目；R2-hosted 无此文件，
                                  downloadUrl 直指 download.clawlego.com 上的 R2 制品）
/store/<kind>/<id>/README.md      长描述（如有）
```

## 新增一个条目

1. 在 `registry/<kind>/` 下建文件夹，名字即 `id`。
2. 写 `clawasset.json`；`hosted` 条目把源文件放进 `files/`，`reference` 条目在
   `install.url` 填上游仓库地址。
3. 本地校验：`pnpm store:check`。
4. 提交 PR。合并到 `main` 后 GitHub Actions 自动构建并部署。
