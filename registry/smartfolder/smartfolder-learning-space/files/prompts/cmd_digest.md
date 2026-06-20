# /digest — 把学习材料消化成结构化笔记

用法：`/digest`（消化所有未处理材料）或 `/digest <相对路径>`（只消化指定文件/目录）。

## 工作流

1. 读 `${SPACE_ROOT}/.llm/state/digest_cursor.json`：拿到 `file_shas`（path → sha256）。不存在按"全量"。
2. 列出 `${SPACE_ROOT}` 下的学习材料（pdf/md/txt/epub/html）。跳过 `.llm/`、隐藏目录。
3. 对每个文件算 sha256；已处理且未变则跳过。
4. 对每个新增/变化的材料：
   - 读内容（PDF 用可用的解析方式；过长分段读）
   - 抽 3–12 条**要点笔记**：每条是一个自包含的知识点，写清 `topic`、`point`（要点正文）、`source`（文件路径 + 章节/页码/位置）
5. 把每条笔记追加到 `${SPACE_ROOT}/.llm/index/notes.jsonl`（按 id 去重；同一材料重处理时先移除其旧笔记再写）：

```jsonl
{"id":"n_a1b2c3d4e5f6","topic":"特征值","point":"方阵 A 的特征值是使 det(A-λI)=0 的 λ；几何上是 A 在某方向上的纯缩放因子。","source":"资料/线代第3章.pdf#p42","digested_at":"2026-06-09T10:00:00Z"}
```

6. 写水位 `${SPACE_ROOT}/.llm/state/digest_cursor.json`：

```json
{"last_digested_at":"2026-06-09T10:00:00Z","file_shas":{"资料/线代第3章.pdf":"sha256:…"}}
```

7. 简报：消化 N 个材料、产出 M 条笔记、新增 K 个 topic；提示"可以 `/outline` 看学习地图，或 `/quiz` 出题了"。

## 规则

- JSONL 一行一条，UTF-8，`\n` 结尾；时间 RFC3339 UTC
- 每条笔记必须有 `source`，能让用户回到原材料
- 单轮建议上限 8 个材料；超出提示 `/digest continue` 续跑
