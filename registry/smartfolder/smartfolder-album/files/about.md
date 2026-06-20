把一个相册文件夹"提升"为智能相册后，每张照片都会被读图、识别人物、抽取地点/时间，索引落在 `.llm/index/` 下，可被任意对话和后续 worker 直接读取。

# 你能用它做什么

- "找出 2025 年所有妈妈的照片"
- "把 2026 年 4 月生日聚会的照片汇成一段回忆"
- "我今年和爸爸合影最多的几天"
- "把没识别出人物的照片列给我"

# 落盘结构（agent 维护）

```
<相册根>/
├── 2026/IMG_001.jpg       ← 原始照片，agent 只读
├── 2025/...
└── .llm/
    ├── manifest.yaml
    ├── about.md
    ├── index/                 ← 索引产物（git-ignored）
    │   ├── photos.jsonl       ← 每张照片一行
    │   ├── persons.jsonl      ← 每个人物一行（跨照片复用 id）
    │   └── moments.jsonl      ← 可选：按时间+地点聚类的"时刻"
    └── state/                 ← 增量水位（git-ignored）
        └── index_cursor.json
```

# 命令

- `/index` — 重建或增量更新照片索引
- `/search <query>` — 按人物/时间/地点/标签检索
- `/persons` — 列出/管理已识别的人物（合并别名、命名匿名人物）
- `/timeline` — 按时间或时刻聚类输出概览

具体工作流、JSONL 字段约定见 prompts/cmd_*.md，attach 时已自动注入到对话开头。
