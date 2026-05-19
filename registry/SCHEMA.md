# 商店注册表规范（registry schema）

`registry/` 是商店的**唯一事实来源**。所有条目由人手工编辑，`scripts/build-store.mjs`
扫描这里，生成 ClawLego 软件消费的 `/store/` 目录。

## 两个正交的维度

每个条目由两个独立的维度描述：

- **`kind`（粒度）** —— 智能资产的聚合层级，由细到粗共三级：
  原子资产（`prompt` / `skill`）→ `mod`（资产包）→ `tpl`（完整智能体）。
- **`source`（来源）** —— 源文件托管在哪：`hosted`（本仓库托管）或
  `reference`（从上游 Git 仓库拉取）。

这两个维度**互不影响**：任何一级粒度都既可以是 `hosted`，也可以是 `reference`。
"来自 GitHub" 是一种来源，**不是**一类资产。

## 目录约定

```
registry/
├── tpl/<id>/      ClawTpl —— 一个完整智能体（基因 + 资产 + 引擎偏好）
├── mod/<id>/      ClawMod —— 资产包（多个智能资产的可整体安装单元）
├── prompt/<id>/   单件提示词 —— 粒度最细的原子资产
└── skill/<id>/    单件技能 —— 粒度最细的原子资产
```

- `<id>` 即文件夹名，必须与 `claw.json` 里的 `id` 一致。
- 约定前缀（按 `kind`，与 `source` 无关）：`clawtpl-*` / `clawmod-*` /
  `prompt-*` / `skill-*`。

## 每个条目的结构

条目要带哪些文件，取决于 `source`：

| 文件 | `source: hosted` | `source: reference` | 说明 |
|---|:--:|:--:|---|
| `claw.json`  | ✓ | ✓ | 清单（必需） |
| `README.md`  | 可选 | 可选 | 长描述，随条目发布 |
| `files/`     | ✓ | – | 被托管的源文件树，构建时整体打成 `bundle.tgz` |

- `hosted` 条目把要分发的源文件放进 `files/`：
  - `prompt` —— 提示词文件（一个或多个 `.md`）。
  - `skill` —— 一个技能的内容（通常是 `SKILL.md`）。
  - `mod` —— 多个资产按 `prompts/` `skills/` `mcp/` `knowledge/` 等子目录组织。
  - `tpl` —— 一个完整智能体的源文件树。
- `reference` 条目不带 `files/`，改在 `install` 里声明上游 Git 仓库。

## `claw.json` 字段

| 字段 | 必需 | 说明 |
|---|:--:|---|
| `id` | ✓ | 与文件夹同名 |
| `kind` | ✓ | `tpl` \| `mod` \| `prompt` \| `skill` |
| `source` | ✓ | `hosted` \| `reference`（与 `kind` 正交） |
| `name` | ✓ | 显示名 |
| `tagline` | ✓ | 一句话副标题 |
| `summary` |  | 段落级描述（商店详情页用） |
| `version` | ✓ | 语义化版本 |
| `category` | ✓ | `design` \| `life` \| `engineering` \| `service` \| `general` |
| `tags` |  | 字符串数组 |
| `icon` |  | Iconify 图标名，如 `material-symbols:extension` |
| `accent` |  | 主题色，默认 `#4F5BFF` |
| `author` |  | `{ name, url }` |
| `license` |  | 许可标识 |
| `contents` |  | 资产计数 `{ prompt, skill, mcp, subagent, knowledge, tool }`；`prompt` / `skill` 条目省略时自动补为 `{ <kind>: 1 }` |
| `install` |  | 安装信息，见下 |
| `homepage` |  | 外部主页（`reference` 条目建议填） |
| `updated` |  | `YYYY-MM-DD`，用于排序 |

### `install` 字段

**`source: hosted`** —— 构建脚本会自动补全 `type`（`tarball`）/ `artifact`
（`bundle.tgz`）。

- `prompt` / `skill`：可整段省略 `install`——`kind` 已表明资产类型，构建脚本会把
  `target` 自动推导为 `business/assets/{kind}s/{id}`。
- `tpl` / `mod`：显式写 `target`，例如：

  ```json
  { "target": "business/assets/mods/{id}" }
  ```

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

`target` 是写入用户实例文件树的相对路径，`{id}` 会被替换为条目 id。

## 构建产物（`/store/`）

```
/store/index.json                全量目录索引 —— ClawLego 首先拉取这个
/store/<kind>/<id>/claw.json      补全后的单条清单
/store/<kind>/<id>/bundle.tgz     可安装载荷（仅 hosted 条目）
/store/<kind>/<id>/README.md      长描述（如有）
```

构建脚本会补全这些字段：`detailUrl`、`downloadUrl`、`bundleBytes`，
并对 `hosted` 条目把 `install.type` 设为 `tarball`、`install.artifact` 设为
`bundle.tgz`。

## 新增一个条目

1. 在 `registry/<kind>/` 下建文件夹，名字即 `id`。
2. 写 `claw.json`；`hosted` 条目把源文件放进 `files/`，`reference` 条目在
   `install.url` 填上游仓库地址。
3. 本地校验：`pnpm store:check`。
4. 提交 PR。合并到 `main` 后 GitHub Actions 自动构建并部署。
