把一个装着学习材料的文件夹"提升"为学习空间后，`/digest` 会把材料消化成结构化笔记（落 `.llm/index/`），`/outline` 给你一张学习地图，`/quiz` 把要点变成抽认卡（作为 scoped 实体长期保存），`/review` 按遗忘曲线挑出今天该复习的卡片陪你过一遍。

# 你能用它做什么

- "把这章 PDF 的要点整理成笔记"
- "给我一张这门课的学习大纲，标出我还没学的部分"
- "拿第 3 章出 10 道题考考我"
- "今天该复习哪些卡片？"
- "我哪些知识点总是记不住？"

# 落盘结构（agent 维护）

```
<学习空间根>/
├── 资料/*.pdf *.md *.txt        ← 学习材料，agent 只读
└── .llm/
    ├── manifest.yaml
    ├── about.md
    ├── index/                   ← 可重建缓存（git-ignored）
    │   ├── notes.jsonl          ← 从材料消化出的要点笔记
    │   └── outline.json         ← 学习大纲 / 知识点树
    ├── entities/                ← scoped 实体（持久，随空间分享）
    │   └── flashcard/
    │       ├── _schema.json
    │       └── records.jsonl    ← 抽认卡 + 复习进度（SRS）
    └── state/
        └── digest_cursor.json   ← 已消化材料的水位
```

# 产物归属（重要）

- **笔记/大纲**是 `/digest`、`/outline` 跑出来的**可重建缓存**，落 `.llm/index/`。
- **抽认卡 + 复习进度**是你长期积累的**学习资产**，作为 **scoped 实体**存 `.llm/entities/flashcard/`——会随空间一起分享/导出，不是临时缓存。
- **一次性的学习报告、总结文档**等本轮产物，一律落**会话** `<CONV_ROOT>/outputs/`——学习空间内**没有** outputs 目录。
