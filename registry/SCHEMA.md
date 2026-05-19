# 商店注册表规范（registry schema）

`registry/` 是商店的**唯一事实来源**。所有条目由人手工编辑，`scripts/build-store.mjs`
扫描这里，生成 ClawLego 软件消费的 `/store/` 目录。

## 目录约定

```
registry/
├── tpl/<id>/        ClawTpl —— 智能体基因 + 出厂模板（托管）
├── mod/<id>/        ClawMod —— 智能资产包（托管）
└── ref/<id>/        开源引用 —— 指向互联网上的开源智能资产（不托管源文件）
```

- `<id>` 即文件夹名，必须与 `claw.json` 里的 `id` 一致。
- 约定前缀：`clawtpl-*` / `clawmod-*` / `ref-*`。

## 每个条目的结构

| 文件 | tpl | mod | ref | 说明 |
|---|:--:|:--:|:--:|---|
| `claw.json`  | ✓ | ✓ | ✓ | 清单（必需） |
| `README.md`  | ✓ | ✓ | – | 长描述（可选，随条目发布） |
| `files/`     | ✓ | ✓ | – | 被托管的源文件树，构建时整体打成 `bundle.tgz` |

`ref` 条目不带 `files/`——它只是一个指向上游仓库的引用。

## `claw.json` 字段

| 字段 | 必需 | 说明 |
|---|:--:|---|
| `id` | ✓ | 与文件夹同名 |
| `kind` | ✓ | `tpl` \| `mod` \| `ref` |
| `source` | ✓ | `hosted`（tpl/mod）\| `reference`（ref） |
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
| `contents` |  | 传统资产计数 `{ prompt, skill, mcp, subagent, knowledge, tool }` |
| `install` |  | 安装信息，见下 |
| `homepage` |  | 外部主页（ref 必填） |
| `updated` |  | `YYYY-MM-DD`，用于排序 |

### `install` 字段

托管条目（tpl/mod）—— 构建脚本会自动补全 `type` / `artifact`：

```json
{ "target": "business/assets/mods/{id}" }
```

引用条目（ref）—— 必须声明 `url`：

```json
{
  "type": "git",
  "url": "https://github.com/owner/repo.git",
  "ref": "main",
  "subdir": "",
  "target": "business/assets/skills/{id}"
}
```

`target` 是写入用户实例文件树的相对路径，`{id}` 会被替换为条目 id。

## 构建产物（`/store/`）

```
/store/index.json                全量目录索引 —— ClawLego 首先拉取这个
/store/<kind>/<id>/claw.json      补全后的单条清单
/store/<kind>/<id>/bundle.tgz     可安装载荷（仅托管条目）
/store/<kind>/<id>/README.md      长描述（如有）
```

构建脚本会补全这些字段：`detailUrl`、`downloadUrl`、`bundleBytes`，
并对托管条目把 `install.type` 设为 `tarball`、`install.artifact` 设为 `bundle.tgz`。

## 新增一个条目

1. 在 `registry/<kind>/` 下建文件夹，名字即 `id`。
2. 写 `claw.json`；托管条目把源文件放进 `files/`。
3. 本地校验：`pnpm store:check`。
4. 提交 PR。合并到 `main` 后 GitHub Actions 自动构建并部署。
