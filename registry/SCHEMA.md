# 商店注册表规范（registry schema）

`registry/` 是商店的**唯一事实来源**。所有条目由人手工编辑，`scripts/build-store.mjs`
扫描这里，生成 ClawLego 软件消费的 `/store/` 目录。

## 两个正交的维度

每个条目由两个独立的维度描述：

- **`kind`（粒度 / 类型）** —— 由细到粗的四级聚合阶梯：
  `brick`（原子积木）→ `mod`（功能组件）→ `tpl`（角色模版）→ `pkg`（智能体包）；
  外加两个**按用途浏览**的目录（不在阶梯上，用户按名字找而非按粒度）：
  `smartfolder`（智能文件夹）与 `biztpl`（业务模板）。
- **`source`（来源）** —— 源文件托管在哪：`hosted`（本仓库托管）或
  `reference`（从上游 Git 仓库拉取）。

## 目录约定

```
registry/
├── brick/<id>/        ClawBrick —— 原子积木（提示词、技能、知识库等单件资产）
├── mod/<id>/          ClawMod —— 功能组件（多个积木的有机组合）
├── tpl/<id>/          ClawTpl —— 角色模版（人格声明 + 默认资产配置）
├── pkg/<id>/          ClawPkg —— 智能体包（开箱即用的完整工作空间，含数据与流程）
├── smartfolder/<id>/  智能文件夹 —— 一个 SmartSpace kind 包（system/smartspace/kinds/<kind>/ 目录树）
└── biztpl/<id>/       业务模板 —— 声明式行为模板（目标 / 工作流 / 研究脚手架，落在 business/ 下）
```

- `<id>` 即文件夹名，必须与 `claw.json` 里的 `id` 一致。
- 约定前缀：`prompt-*` / `skill-*` / `clawmod-*` / `clawtpl-*` / `clawpkg-*` /
  `smartfolder-*` / `biztpl-*`。

## 每个条目的结构

条目要带哪些文件，取决于 `source`：

| 文件 | `source: hosted` | `source: reference` | 说明 |
|---|:--:|:--:|---|
| `claw.json`  | ✓ | ✓ | 清单（必需） |
| `README.md`  | 可选 | 可选 | 长描述，随条目发布 |
| `files/`     | ✓ | – | 被托管的源文件树，构建时整体打成 `bundle.tgz` |

- `hosted` 条目把要分发的源文件放进 `files/`：
  - `brick` —— 单个资产文件（如 `SKILL.md` 或提示词 `.md`）。
  - `mod` —— 资产按 `prompts/` `skills/` `mcp/` `knowledge/` 等子目录组织。
  - `tpl` —— 包含 `agent.json` 等配置的模版文件。
  - `pkg` —— 完整的实例目录树（不含用户私密数据）。
  - `smartfolder` —— 一个 SmartSpace kind 目录的内容（`manifest.yaml` + `about.md` +
    `prompts/cmd_*.md` + `.source`）。`install.target` 写
    `system/smartspace/kinds/<kind>`（kind slug 即 manifest.yaml 的 `metadata.name`）。
  - `biztpl` —— 一个行为模板目录的内容：工作流 `WORKFLOW.md`，或目标
    `GOAL.md` + `success.md` + `example_plan.md`。`install.target` 写
    `business/workflows/<slug>` 或 `business/goals/<slug>`。
- `reference` 条目不带 `files/`，改在 `install` 里声明上游 Git 仓库。

## `claw.json` 字段

| 字段 | 必需 | 说明 |
|---|:--:|---|
| `id` | ✓ | 与文件夹同名 |
| `kind` | ✓ | `brick` \| `mod` \| `tpl` \| `pkg` \| `smartfolder` \| `biztpl` |
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

## 构建产物（`/store/`）

```
/store/index.json                全量目录索引 —— ClawLego 首先拉取这个
/store/<kind>/<id>/claw.json      补全后的单条清单
/store/<kind>/<id>/bundle.tgz     可安装载荷（仅 hosted 条目）
/store/<kind>/<id>/README.md      长描述（如有）
```

## 新增一个条目

1. 在 `registry/<kind>/` 下建文件夹，名字即 `id`。
2. 写 `claw.json`；`hosted` 条目把源文件放进 `files/`，`reference` 条目在
   `install.url` 填上游仓库地址。
3. 本地校验：`pnpm store:check`。
4. 提交 PR。合并到 `main` 后 GitHub Actions 自动构建并部署。
