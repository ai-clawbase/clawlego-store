这是一个由笔记连接器（Obsidian / Notion 等）维护的**本地镜像**智能文件夹：连接器按设定间隔把你的笔记单向同步成本地 markdown，你拿到的是真实文件——离线也能读、能全文检索、能看双链、能 attach 进对话。

# 你能用它做什么

- "我之前关于『定价策略』记过什么？"（跨笔记全文检索）
- "把链接到《产品愿景》这则笔记的都列出来"（反向链接）
- "上周我都记了些什么"（按日期轴回看）
- "把『读书笔记/』这个目录梳理成一份提纲"
- "根据我的笔记回答：当时我们为什么放弃方案 B？"（基于笔记内容问答）

# 与连接器的分工

- **连接器**（cloudsync supervisor）：定时把笔记产品 → 本地 markdown，状态在 portal 采集器页可见
- **这个文件夹**（agent）：在本地镜像上索引、检索、双链分析、问答——**只读**，V1 不写回笔记产品
- 想立即同步：去 portal 采集器页点触发；agent 不能代触发（V2 提供 clawctl 动词）

# 落盘结构

```
business/sync/<连接器>/<实例>/
├── （笔记产品镜像下来的真实 .md 文件，agent 只读）
│   ├── 日记/2026-06-14.md
│   ├── 项目/产品愿景.md
│   └── attachments/...        ← 图片/白板/PDF 附件
└── .llm/
    ├── manifest.yaml          ← fields 里有 connector_id / connector_instance_id / remote_path
    ├── index/notes.jsonl      ← /search 用的笔记清单 + 摘要 + 标签
    ├── index/links.jsonl      ← /backlinks 用的双链图（[[wikilink]] 与 markdown 链接）
    └── state/index_cursor.json
```

# 命令

- `/search <query>` — 跨笔记全文/标签/时间检索
- `/backlinks <笔记名>` — 谁链接到了这则笔记（反向链接 + 共现）
- `/daily [范围]` — 按日期轴回看这段时间记了什么
- `/outline [目录]` — 把一个目录/主题梳理成结构化提纲
- `/ask <问题>` — 基于笔记内容回答（带出处链接）

# 注意

- 删除这个文件夹的连接器实例后，marker 会被移除但**镜像数据保留**
- 手动改动镜像内容可能被下次同步覆盖——把它当只读副本用
- `[[双链]]` 解析按 Obsidian 习惯（按文件名匹配，忽略大小写与路径）；Notion 来源里的页面引用同样落成相对链接
