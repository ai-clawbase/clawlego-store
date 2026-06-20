把会议材料(转写稿/速记/纪要文件)丢进 `raw/`,agent 自动出结构化纪要;行动项带责任人和期限,可跨会议追踪;还能查"上上周谁提过预算的事"。

# 你能用它做什么

- 丢一份转写稿 → "/digest" 出纪要
- "我手上还有哪些没完成的行动项?"(/actions)
- "关于定价,之前几次会都说了什么?"(/search)
- "把这季度所有会的决定汇总一下"

# 落盘结构(agent 维护)

```
<会议根>/
├── raw/2026-06-12-产品周会.txt      ← 原始材料,丢这里,agent 只读
├── minutes/2026-06-12-产品周会.md   ← 纪要(agent 代写,你的资产)
└── .llm/
    ├── manifest.yaml
    ├── about.md
    ├── index/
    │   ├── meetings.jsonl     ← 每场会一行(git-ignored,可重建)
    │   └── actions.jsonl      ← 每条行动项一行
    └── state/digest_cursor.json
```

# 命令

- `/digest` — 处理 raw/ 里的新材料:出纪要存 minutes/,抽取行动项
- `/actions [人]` — 行动项看板:按人/按状态;支持"标记完成"
- `/search <query>` — 跨会议检索:谁在哪次会说过什么、做过什么决定

# 注意

- 纪要是你的资产,不会被 gitignore;原始材料永不修改
- 行动项的"完成"由你口头确认,agent 不自行判断
