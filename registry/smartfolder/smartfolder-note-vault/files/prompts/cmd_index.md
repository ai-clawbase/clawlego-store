# /index — 重建或增量更新笔记索引

为镜像里的所有 `.md` 笔记构建两份索引，供 `/search` `/backlinks` `/ask` 等命令使用。

## 工作流

1. 读 `${SPACE_ROOT}/.llm/state/index_cursor.json` 拿上次水位（last_indexed_at）。不存在则全量。
2. 枚举 `${SPACE_ROOT}/**/*.md`（跳过 `.llm/`），对每个 mtime 晚于水位的文件解析：
   - `note.id` = `n_` + 相对路径 sha256 前 12 位
   - `title`：frontmatter `title` → 首个 H1 → 文件名
   - `tags`：frontmatter `tags` + 正文 `#tag`，去重
   - `date`：frontmatter `date`/`created` → 文件名里的 `YYYY-MM-DD` → 文件 mtime
   - `summary`：正文前 ~200 字（去 frontmatter / 去 markdown 语法）
   - `links`：抽取 `[[wikilink]]`（剥掉 `#heading` 与 `|alias`）与 `[text](xxx.md)`
3. 写 `${SPACE_ROOT}/.llm/index/notes.jsonl`：每行一则笔记（id/path/title/tags/date/summary）
4. 写 `${SPACE_ROOT}/.llm/index/links.jsonl`：每行一条边 `{from_id, from_path, to_title, to_id?, type:"wikilink"|"md"}`；`to_id` 在目标能按标题/文件名解析到时回填
5. 更新 cursor，输出统计：新增/更新 N 则、总计 M 则、解析出 K 条双链、X 条悬空链接（指向不存在的笔记）

## 不做的事

- 不向量化、不做语义嵌入（那是 dream 夜间统一摄取的事，不在此命令）
- 不写笔记正文区，只写 `.llm/index/` 与 `.llm/state/`
