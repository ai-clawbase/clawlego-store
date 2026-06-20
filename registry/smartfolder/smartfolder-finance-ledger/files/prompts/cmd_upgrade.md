# /upgrade — 升级到新版模板

把本实例的数据与设置迁移到当前模板版本。**旧数据零丢失**。
路线图见 `.llm/template/migrations/manifest.yaml`,逐版 playbook 在 `.llm/template/migrations/<id>.md`。

## 版本是怎么回事

- **模板版本** = `.llm/template/migrations/manifest.yaml.current`(= kind manifest 的 metadata.version)。
  模板(`.llm/template/` 下的 schemas/migrations/seed + `.llm/ui/`)随 mod 升级被**整体替换**为新版,
  是只读的、可丢弃重来的;它从不持有用户数据。
- **实例版本** = `.llm/data/_template.json.template_version`,记录本实例数据当前符合哪个版本。
- 两者相等 → 已是最新,告诉用户无需升级。`_template.json` 缺失 → 视为 v1 老实例。

## 工作流

1. 读 `_template.json`(缺则按 v1:template_version=1.0.0, data_schema_version=1)与
   `.llm/template/migrations/manifest.yaml`。若实例版本 ≥ current,报"已是最新 vX",结束。
   > 若 `.llm/template/` 仍是旧版(mod 已更新但模板未刷新),先从已安装的 kind 源
   > `system/smartspace/kinds/finance_ledger/scaffold/template/` 与 `…/scaffold/ui/`
   > 重新复制覆盖 `.llm/template/` 和 `.llm/ui/`(这两处可整体替换,不含用户数据)。
2. 选出 `migrations[]` 里 `from` 匹配实例版本、`to` 递增直到 current 的链条,**按顺序**执行。
3. 每条迁移:
   - `backup:true` → 先把 `.llm/data/` 复制到 `.llm/backups/<from>-<时间戳>/`(已存同名则跳过)。
   - 按其 playbook 执行:**只增量改设置层、给真相层补默认**,绝不改写/删除 records 历史行。
     每步先探测后改,幂等可重跑。
   - 写回 `_template.json`:更新 `template_version`/`data_schema_version`,`history` 追加一条
     `{to, at, migration, by:"upgrade"}`,刷新 `migrated_at`。
4. **账目入实体库(确定性,一次性)**:运行 `/migrate` —— 它用内置函数 `entity.import_jsonl`
   把 `.llm/data/records/*.jsonl` 的历史账目按 `id` 去重迁入 scoped 实体 `.llm/entities/transaction/`
   (免 LLM、幂等可重跑、原文件保留作备份)。这是 v2.x 把"真相层"从手搓 JSONL 收口到实体引擎
   (白送 PK 去重 / 写入校验 / 可查询索引)的关键一步;迁移后 `/record` 直接写实体库。
5. 全部跑完且 `rebuild_index:true` → 清空 `.llm/index/` 执行 `/index` 重建,并重写 `.llm/ui/schema.json`。
   解析缓存 `.llm/cache/parse/` **不动**(按内容哈希,跨版本自然复用)。
6. **兼容自检**(取自 playbook 末尾):records 行数不变、旧账目仍可统计、实体库条数=历史行去重数、
   `records_digest` 新鲜、重跑 `/migrate` 不产生重复(created=0)。任一不过 → 停下来报告,不写新版本号。
7. 汇报:从 vX 升到 vY,新增能力一句话,旧账目 N 笔全部保留,备份位置,以及可立刻试的新命令。

## 铁律

- 真相层(records)只读不改;需要的新字段一律靠读取方补默认(transaction.schema 的 rules)。
- 派生层从不迁移,只重建。
- 任何一步失败都能从 `.llm/backups/` 回滚;失败时如实说明并保留现场。
