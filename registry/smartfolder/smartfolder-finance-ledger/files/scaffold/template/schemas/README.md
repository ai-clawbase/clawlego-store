# 账本数据契约 (schemas/)

这些文件是账本所有结构的**唯一真相来源**。prompts 与 migrations 都引用它们,不要在别处复述字段。

实例里它们落在 `.llm/template/schemas/`(连同 `.llm/template/migrations/`、`.llm/template/seed/`
一起构成**可整体替换的模板层**):随 kind 模板发布,`/upgrade` 时被新版整体替换。模板层只读、
不持有任何用户数据,删了也能从 kind 重新铺一份。用户数据在 `.llm/data/`,产物在根目录 `llm_output/`。

## 三层数据 + 兼容原则

| 层 | 位置 | 是否用户资产 | 升级时 | 兼容机制 |
|---|---|---|---|---|
| **真相层** 账目 | `.llm/data/records/YYYY-MM.jsonl` | 是,永久 | **永不改写历史行** | 每行带 `schema` 整数版本戳;读取方对低版本行补默认值(行级向前兼容) |
| **设置层** | `.llm/data/*.json` | 是,纳入备份 | 迁移**只增字段、补默认**,带 `schema_version` | 缺字段=用默认;迁移幂等可重跑 |
| **派生层** 索引/解析 | `.llm/index/*`、`.llm/cache/parse/*` | 否,可重建 | **从不迁移,直接判旧→重建/重解析** | 见下 |

## 派生层向前兼容(核心)

- **索引** `.llm/index/`:每个文件带 `schema_version` 与 `records_digest`(账目文件指纹)。读取规则:`schema_version != 当前` 或 `records_digest` 不符 → 视为脏,丢弃并重建(`/index`)。永不跨版本信任索引。
- **图片/视频/CSV 解析** `.llm/cache/parse/<sha256>.json`:**按源文件内容哈希寻址**,每条带 `parser_version`。
  - 复用规则:`parser_version >= parse-cache.schema.json.min_parser_version` 才复用,否则重解析覆盖。
  - 因为按内容哈希,**同一张账单再拖进来直接命中缓存**;模板升级不动这些文件,旧解析自然留存。
  - 解析结果只是"建议账目",真正入账后写入 .llm/data/records/;所以即使某天 parser 改了格式,旧缓存失效也只是触发重解析,**不会丢任何已入账数据**。

## 版本号

- **模板版本** `metadata.version`(manifest.yaml,semver):整套模板的版本。
- **数据 schema 版本** `data_schema_version`(整数,migrations/manifest.yaml 维护):只在账目/设置**结构破坏性变更**时 +1。索引、解析缓存各自带独立 `schema_version`,与数据版本解耦。
- 实例侧 `.llm/data/_template.json` 记录本实例数据当前符合的 `template_version` 与 `data_schema_version`。

## 文件清单

- `transaction.schema.json` — 一笔账目(records 行)
- `account.schema.json` — 账户簿(.llm/data/accounts.json)
- `budget.schema.json` — 预算(.llm/data/budget.json)
- `category.schema.json` — 分类法(.llm/data/categories.json)
- `recurring.schema.json` — 周期账单/订阅(.llm/data/recurring.json)
- `goal.schema.json` — 储蓄目标(.llm/data/goals.json)
- `index.schema.json` — 派生索引(.llm/index/*)
- `parse-cache.schema.json` — 解析缓存(.llm/cache/parse/*)
- `template-state.schema.json` — 实例模板状态(.llm/data/_template.json)
