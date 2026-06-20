# /index — 重建或增量更新照片索引

## 工作流

1. 读 `${SPACE_ROOT}/.llm/state/index_cursor.json`：拿到 `file_shas` 字典（path → sha256）。如果文件不存在，按"全量"处理。
2. 在 `${SPACE_ROOT}` 下递归列出所有图片/视频（白名单：jpg/jpeg/png/heic/heif/webp/mp4/mov）。跳过 `.llm/`、`.git/`、隐藏目录、`@eaDir`、`Thumbs.db` 等垃圾。
3. 对每张照片计算 sha256（如果已在 cursor 里且 sha 没变，跳过）。
4. 对每张"新增/变化"的照片：
   - 抽 EXIF → captured_at (RFC3339 UTC), captured_at_source = "exif" or "mtime"
   - 抽 EXIF GPS → location.lat/lon；用反查或常识写 location.place（如 "北京·朝阳"）；无 EXIF 时留空
   - **看图**（vision capability）→ caption（50–120 字中文，客观描述）、scene、tags[]（3–8 个）
   - **识别人物**：先读 `${SPACE_ROOT}/.llm/index/persons.jsonl` 找现有人物特征，按视觉相似+上下文判断是否复用。新人物分配 `per_NNN`（NNN 从已有最大值+1）。
5. 把每张照片输出一行追加到 `${SPACE_ROOT}/.llm/index/photos.jsonl`：

```jsonl
{"id":"p_a1b2c3d4e5f6","path":"2026/IMG_001.jpg","sha256":"…","size":4521234,"captured_at":"2026-04-12T14:23:00Z","captured_at_source":"exif","location":{"lat":39.91,"lon":116.40,"place":"北京·朝阳"},"persons":["per_001","per_002"],"tags":["生日","蛋糕","室内"],"caption":"妈妈和孩子在客厅切生日蛋糕，桌上有粉色装饰。","scene":"室内·生日聚会","indexed_at":"2026-06-07T10:00:00Z","indexer":"<engine_id>"}
```

6. 更新 `${SPACE_ROOT}/.llm/index/persons.jsonl`（替换写整文件，保证 id 唯一、photo_count/signature_photos 准确）：

```jsonl
{"id":"per_001","display_name":"妈妈","aliases":["母亲","mom"],"first_seen":"2025/IMG_087.jpg","photo_count":23,"signature_photos":["2025/IMG_087.jpg","2026/IMG_001.jpg"],"notes":""}
```

7. 写入 cursor：`${SPACE_ROOT}/.llm/state/index_cursor.json`

```json
{"last_indexed_at":"2026-06-07T10:00:00Z","engine":"<engine_id>","file_shas":{"2026/IMG_001.jpg":"sha256:…"}}
```

8. 挑一张封面：从已索引照片里选最能代表这个相册的一张（清晰、有代表性场景/人物，优先近期），把它相对 `${SPACE_ROOT}` 的路径写入 `${SPACE_ROOT}/.llm/state/cover.txt`（纯文本一行）。harness 会用它做相册卡片封面；没有这个文件时 harness 自动取最新一张图片。
9. 结束时给用户一份简报：处理 N 张新图、新发现 M 个人物、跳过 K 张未变照片，列出"需要命名的匿名人物"。

## 输出格式规则

- JSONL 严格一行一条，UTF-8，结尾 `\n`
- 时间统一 RFC3339 UTC（`Z` 结尾）
- path 是相对 `${SPACE_ROOT}` 的 forward-slash 路径
- caption 必须客观、不带主观情绪，便于后续检索

## 性能 / 礼貌

- 单轮处理建议上限 50 张。超出告诉用户"还剩 N 张，回 `/index continue` 续跑"
- 不要一次性把所有照片塞到上下文；分批 read + write
