# /map — 重建或增量更新代码库索引

## 工作流

1. 读 `${SPACE_ROOT}/.llm/state/map_cursor.json`：拿到 `file_shas`（path → sha256）。文件不存在按"全量"处理。
2. 在 `${SPACE_ROOT}` 下递归列出源码文件，套用 persona 的"跳过名单"。优先用 `rg --files` 列举。
3. 对每个文件算 sha256（已在 cursor 且 sha 未变则跳过）。
4. 对每个"新增/变化"的文件：
   - 判定 `lang`、统计 `loc`（行数）
   - **读文件**，产出 `summary`（40–100 字中文，说明这个文件的职责）
   - 抽 `exports`：对外暴露的顶层符号（函数/类型/类/常量），每个记 name + kind + 签名 + 起始行
   - 抽 `imports`：依赖的内部包/模块路径（外部依赖归一为包名即可）
5. 把每个文件输出一行追加/覆盖到 `${SPACE_ROOT}/.llm/index/files.jsonl`：

```jsonl
{"id":"internal/syncer/syncer.go","lang":"go","loc":312,"summary":"USB↔本地工作区双向同步，带锁文件；启动时拷入缓存，退出时写回。","exports":[{"name":"Sync","kind":"func","sig":"func Sync(src, dst string) error","line":48}],"imports":["internal/fsutil","internal/journal"],"sha256":"…","indexed_at":"2026-06-09T10:00:00Z"}
```

6. 同步维护符号索引 `${SPACE_ROOT}/.llm/index/symbols.jsonl`（每个导出符号一行；变化文件的旧符号先移除再写新）：

```jsonl
{"id":"internal/syncer/syncer.go#Sync","name":"Sync","kind":"func","file":"internal/syncer/syncer.go","line":48,"sig":"func Sync(src, dst string) error","doc":"Sync 把源工作区拷到目标缓存。"}
```

7. 写水位 `${SPACE_ROOT}/.llm/state/map_cursor.json`：

```json
{"last_mapped_at":"2026-06-09T10:00:00Z","engine":"<engine_id>","language":"go","file_shas":{"internal/syncer/syncer.go":"sha256:…"}}
```

8. 简报：索引 N 个文件、新增/更新 M 个符号、跳过 K 个未变文件，并指出"看起来是入口的文件"（main / cmd / index / app）。

## 规则

- JSONL 严格一行一条，UTF-8，`\n` 结尾；路径相对 `${SPACE_ROOT}`，forward-slash
- 时间统一 RFC3339 UTC
- summary 客观描述职责，不夸大、不臆测未读到的代码

## 性能 / 礼貌

- 单轮建议上限 60 个文件；超出告诉用户"还剩 N 个，回 `/map continue` 续跑"
- 分批 read + write，不要把整个仓库一次性读进上下文
