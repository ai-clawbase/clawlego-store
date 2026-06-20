# /outline — 生成或刷新学习大纲

把已消化的笔记组织成一张"学习地图"：知识点树 + 推荐学习顺序 + 进度标注。

## 工作流

1. 读 `${SPACE_ROOT}/.llm/index/notes.jsonl` 拿到全部要点与 `topic`。笔记为空则提示先 `/digest`。
2. 读 manifest 的 `subject`/`goal`/`level`，据此定难度与详略。
3. 把 topic 聚成一棵树：`章/节 → 知识点`，每个节点挂上对应的 note id（可溯源）。
4. 标注每个节点的状态：
   - `learned`：已有抽认卡且最近复习通过
   - `seen`：有笔记但还没出卡
   - `gap`：goal 需要但当前材料没覆盖（明确标出，提示用户补材料）
5. 给一条**推荐学习顺序**（依赖在前、由浅入深）。
6. 写 `${SPACE_ROOT}/.llm/index/outline.json`（整文件覆盖）：

```json
{
  "subject": "线性代数",
  "generated_at": "2026-06-09T10:00:00Z",
  "nodes": [
    {"topic": "向量空间", "status": "learned", "notes": ["n_..."], "children": [
      {"topic": "线性相关", "status": "seen", "notes": ["n_..."]}
    ]},
    {"topic": "奇异值分解", "status": "gap", "notes": [], "note": "goal 需要但材料未覆盖"}
  ],
  "recommended_order": ["向量空间", "线性相关", "特征值", "奇异值分解"]
}
```

7. 给用户一份可读的大纲视图（树形 markdown），高亮 `gap` 节点。

## 规则

- 只基于已有笔记 + manifest 目标；不凭空加材料里没有的知识点（除非标 `gap`）
- outline 是可重建缓存，随时可 `/outline` 重跑
