一个会陪你写、帮你回看的日记本。日记是纯 Markdown 文件,按日期落盘——哪天不用这个系统了,文件夹拷走就是完整的日记本。

# 你能用它做什么

- "今天有点累,帮我把这一天理一理"(/write 引导成文)
- "这个月我都在忙什么?"(/review 月度回顾)
- "我最近的状态怎么样?"(/mood 情绪曲线)
- "去年今天我写了什么?"

# 落盘结构(agent 维护)

```
<日记根>/
├── 2026/
│   ├── 06-11.md           ← 一天一文件,YAML frontmatter 带 mood/tags
│   └── 06-12.md
└── .llm/
    ├── manifest.yaml
    ├── about.md
    ├── index/entries.jsonl    ← 条目索引(git-ignored,可重建)
    └── state/review_cursor.json
```

# 命令

- `/write` — 引导式写作:agent 按 tone 风格陪你把今天聊成一篇日记
- `/review [周期]` — 周/月/年回顾:主题、事件、变化
- `/mood` — 按 frontmatter 的 mood 字段画情绪走势,指出拐点

# 隐私

日记内容只在 attach 这个空间的对话里可见;不会被其他对话或 worker 主动读取。
