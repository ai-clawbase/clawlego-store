# /index — 重建派生索引与工作台视图

派生层结构见 `.llm/template/schemas/index.schema.json`。索引可完全由 records 重建,
是性能缓存,**绝不是真相**。

## 何时跑

- 报表/预算/账户查询前发现索引不新鲜(`_index.json.records_digest` 与现状不符,或
  `schema_version` 不等当前)。
- 迁移收尾(见 /upgrade)。
- 用户手动要求,或大批导入后。

## 工作流

1. 全量扫 `.llm/entities/transaction/records.jsonl`,冲正/void 行对消,转账只动账户余额。
2. 写各派生文件:
   - `monthly.json` — 按月 { income, expense, net, by_category, by_account, count }
   - `accounts_balance.json` — { as_of, base_currency, accounts:{id:{balance,balance_base}}, net_worth_base }
   - `merchants.json` / `tags.json` — 近 12 月聚合
   - `budget_state.json` — 当月各类 limit/used/carryover/remaining/pace_warn
3. 写头文件 `.llm/index/_index.json`:`schema_version`、`data_schema_version`、`built_at`、
    `records_digest`(对实体库文件的 路径|大小|mtime 排序后 sha256)。
4. 用最新聚合**重写 `.llm/ui/schema.json`** 的四页(总览/报表/预算/账户),保持工作台视图新鲜。

## 要点

- 增量更新(/record 入账后顺手改当月条目)允许,但必须同时刷新 `records_digest`;拿不准就整建。
- 解析缓存 `.llm/cache/parse/` 不在本命令重建——它按内容哈希寻址,自然跨版本留存。
