# /search — 按人物/时间/地点/标签检索照片

## 输入

用户的自然语言查询，例如：
- "找出 2025 年所有有妈妈的照片"
- "去年夏天在云南拍的"
- "有蛋糕和蜡烛的合影"
- "没识别出人物的照片"

## 工作流

1. 解析查询 → 把意图转成对 `photos.jsonl` 字段的过滤：
   - 人物：解析人名 → 查 `persons.jsonl` 的 display_name/aliases → 拿 person_id → 过滤 photos 的 persons 包含该 id
   - 时间：解析"去年夏天" → captured_at 范围
   - 地点：解析"云南" → location.place 模糊匹配
   - 标签/场景：解析"蛋糕" → tags 包含或 caption 包含
   - 否定：解析"没识别出人物的" → persons 为空数组
2. 读 `${SPACE_ROOT}/.llm/index/photos.jsonl`，过滤
3. 命中 0 张时：说明没找到、给出"是否要 /index 重建索引？"
4. 命中 ≥ 1 张时：按 captured_at 降序，每张输出一行 `<日期> · <相对路径> · <caption 前 60 字>`，封顶 30 张；多余的提示"还有 N 张"

## 不做的事

- 不要把原图二进制读进上下文（除非用户明确要看图）
- 不要在 search 流程里"边读边补索引"——如果 cursor 显示有照片没索引，提示用户先跑 /index
