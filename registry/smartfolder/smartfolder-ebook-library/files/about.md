把电子书目录"提升"为书库后,每本书都会被识别:书名、作者、语言、主题。还能按主题上架出书单、存读后摘记。

# 你能用它做什么

- "我书库里有没有讲分布式系统的书?"
- "把所有 Go 相关的书列个阅读顺序"
- "上次没读完的是哪本?"
- "给《人月神话》记一条读后感"

# 落盘结构(agent 维护)

```
<书库根>/
├── 技术/Designing Data-Intensive Applications.epub   ← 书,agent 只读
├── 小说/...
├── notes/<书 id>.md          ← 读后摘记(agent 代写,属于你的资产)
└── .llm/
    ├── manifest.yaml
    ├── about.md
    ├── index/books.jsonl      ← 每本书一行(git-ignored,可重建)
    └── state/index_cursor.json
```

# 命令

- `/index` — 重建或增量建库:识别书名/作者/语言/主题
- `/search <query>` — 按书名/作者/主题检索
- `/shelf [主题]` — 出主题书单(带阅读顺序建议);不带参数则总览各主题藏书

# 注意

- 摘记写在 `notes/` 下,是你的持久资产,不会被 gitignore
- agent 不重命名/移动书文件
