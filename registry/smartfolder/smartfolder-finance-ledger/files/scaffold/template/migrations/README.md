# migrations/ —— 账本模板的版本迁移

每个 `<id>.md` 是一份 agent 执行的迁移 playbook;`manifest.yaml` 是路线图。由
`/upgrade`(prompts/cmd_upgrade.md)驱动。

## 为什么迁移是声明式 playbook 而非 Go 代码

本 mod「只携带声明式资产,无 Go 代码」。迁移是文件变换(补建 state、给旧行补默认、
重建索引),由 agent 按 playbook 执行最自然,也让用户能审阅每一步。

## 编写新迁移的规矩

1. **幂等**:每步先探测目标状态,已是新版就跳过;允许中断后重跑。
2. **不毁真相**:`.llm/data/records/*.jsonl` 历史行**绝不改写/删除**;只能追加。需要新字段就靠
   读取方补默认(transaction.schema 的 rules),而不是回改老行。
3. **设置只增不减**:`.llm/data/*.json` 补字段、补默认、补新文件;不删用户已设的值。
4. **派生层不迁移**:`.llm/index`、`.llm/cache` 跑完迁移后重建/重算;迁移里不要手改它们。
   解析缓存按内容哈希,天然跨版本留存,只在 parser_version 落后于 `min_parser_version`
   时才会被重解析覆盖。
5. **先备份**:`manifest.yaml` 标 `backup: true` 的,动手前把 `.llm/data/records/` 和
   `.llm/data/` 复制到 `.llm/backups/<from>-<时间戳>/`,失败可回滚。
6. **收尾**:更新 `.llm/data/_template.json`(template_version / data_schema_version /
   追加 history 一条),需要时 `rebuild_index`。

## 加一个版本(模板作者流程)

1. 改 `schemas/` 里相关结构,需要时 `data_schema_version` +1。
2. 写 `migrations/vX-to-vY.md` playbook。
3. `migrations/manifest.yaml`:`current`、(必要时)`data_schema_version`,append 一条迁移。
4. `manifest.yaml` `metadata.version` 同步到新 semver。
5. 必要时更新 `scaffold/data/`(新建实例的初始数据/设置)、`scaffold/template/seed/`、
   `scaffold/ui/` 与 `prompts/`。注意:`scaffold/template/` 与 `scaffold/ui/` 是可整体替换的
   模板层(无用户数据);`scaffold/data/` 是新实例的初始用户数据,只在建账时铺一次。
