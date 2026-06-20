# /quiz — 出题并沉淀为抽认卡（scoped 实体）

用法：`/quiz`（围绕薄弱/未出卡的 topic 出题）或 `/quiz <topic>`（针对某主题）或 `/quiz <N>`（出 N 道）。

## 工作流

1. 读 `${SPACE_ROOT}/.llm/index/notes.jsonl` 选材；读 `${SPACE_ROOT}/.llm/entities/flashcard/records.jsonl`（若存在）避免重复出卡。
2. 围绕选定 topic 出题（默认 5–10 道）：题型可混合（概念问答 / 填空 / 判断 / 简答）。每题答案必须能溯源到某条 note 的 `source`。
3. **先和用户互动考一遍**：一题一题问，用户答完再给标准答案 + 讲解；记下用户答对/答错。
4. 把每道题沉淀为一张**抽认卡**，作为 scoped 实体持久保存。首次写卡前确保 schema 存在 `${SPACE_ROOT}/.llm/entities/flashcard/_schema.json`：

```json
{"name":"flashcard","display_name":"抽认卡","fields":[
  {"name":"id","type":"string"},{"name":"topic","type":"string"},
  {"name":"front","type":"string"},{"name":"back","type":"string"},
  {"name":"source","type":"string"},{"name":"created_at","type":"string"},
  {"name":"due_at","type":"string"},{"name":"interval_days","type":"number"},
  {"name":"ease","type":"number"},{"name":"reps","type":"number"},{"name":"lapses","type":"number"}
]}
```

5. 追加卡片到 `${SPACE_ROOT}/.llm/entities/flashcard/records.jsonl`（新卡 SRS 初值：`interval_days=0, ease=2.5, reps=0, lapses=0, due_at=今天`；若本轮已考且答对，可直接按 /review 规则推进一次）：

```jsonl
{"id":"fc_001","topic":"特征值","front":"方阵 A 的特征值定义是什么？","back":"使 det(A-λI)=0 的标量 λ。","source":"资料/线代第3章.pdf#p42","created_at":"2026-06-09T10:00:00Z","due_at":"2026-06-09","interval_days":0,"ease":2.5,"reps":0,"lapses":0}
```

6. 简报：新增 N 张卡、覆盖哪些 topic、本轮答对率；提示"`/review` 按遗忘曲线复习"。

## 规则

- 抽认卡 id 永久不变；不删卡（淘汰用 lapses/标记，不物理删）
- 答案必须溯源；材料没覆盖就不出该题
- records.jsonl 一行一卡，UTF-8，`\n` 结尾
