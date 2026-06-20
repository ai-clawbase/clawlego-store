# /index — 重建索引

重建诗词书房的派生索引层，加速搜索和推荐。

## 工作流

1. 扫描 `.llm/entities/poem/records.jsonl` 全量数据
2. 重建索引：
   - `by_author.json`：作者 → 作品列表
   - `by_dynasty.json`：朝代 → 作品列表
   - `by_tag.json`：主题标签 → 作品列表
   - `by_difficulty.json`：难度 → 作品列表
   - `keyword_index.json`：关键词倒排索引（支持模糊搜索）
   - `recommendations.json`：每日推荐候选池
3. 刷新 `.llm/index/_meta.json`（records_digest 和 schema_version）
4. 输出索引统计：X 位诗人、Y 首诗词、Z 个朝代
5. 同时刷新 `.llm/ui/schema.json` 工作台视图（诗词库概览）

## 要点

- 派生层可随时重建，真相永远在 `entities/poem/records.jsonl`
- 索引格式见 `template/schemas/index.schema.json`
- 推荐在 `/import` 之后运行
