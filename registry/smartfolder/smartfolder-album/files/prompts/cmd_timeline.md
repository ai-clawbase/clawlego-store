# /timeline — 时间线 / "时刻"聚类

## 工作流

1. 读 `${SPACE_ROOT}/.llm/index/photos.jsonl`
2. 按 captured_at + location 聚类成"时刻"（moment）：
   - 同一时刻：时间差 ≤ 6 小时 且 地点（lat/lon 0.1 度内 或 place 字符串相同）
3. 为每个时刻：
   - title：从该时刻最多 5 张照片的 caption 里抽公共主题，30 字内（例：「妈妈的 60 岁生日」「云南行 Day 2 - 玉龙雪山」）
   - summary：80–150 字，叙述类语气，避免堆字段
   - person_ids：union of all photos
4. 输出到 `${SPACE_ROOT}/.llm/index/moments.jsonl`（整文件 truncate-rewrite）：

```jsonl
{"id":"mom_001","title":"妈妈的 60 岁生日","start":"2026-04-12T13:00:00Z","end":"2026-04-12T18:00:00Z","location":"北京·朝阳","photo_ids":["p_a1b2…"],"person_ids":["per_001","per_002"],"summary":"…"}
```

5. 用户看到：
   - 时间线视图（按 start 倒序）
   - 每条一行：`<日期> · <title> · <photo_count> 张 · <person 列表>`

## 无 captured_at 的照片

放进"未归档"段（mom_unknown），让用户决定是否手动归类。
