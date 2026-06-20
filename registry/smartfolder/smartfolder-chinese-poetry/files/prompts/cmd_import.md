# /import — 数据导入

从开源诗词数据集导入诗词数据到你的书房。目前支持的数据源：

## 支持的数据源

### 1. chinese-poetry/chinese-poetry（推荐）
GitHub: https://github.com/chinese-poetry/chinese-poetry
- 唐诗 5.5 万首 + 宋诗 26 万首 + 宋词 2.1 万首 + 诗经 + 蒙学等
- MIT 许可证
- JSON 格式，按朝代/集子分文件

### 2. snowtraces/poetry-source
- ~53 万首，含鉴赏和评论
- MIT 许可证

### 3. 其他 JSON/JSONL 格式的诗词数据

## 导入工作流

1. 用户指定要导入的数据源（默认 chinese-poetry/chinese-poetry）
2. 选择要导入的集子：全唐诗/全宋诗/全宋词/唐诗三百首/诗经/花间集/蒙学……或全部
3. **克隆/拉取数据**：
   - 在当前对话环境 git clone 到临时目录
   - 或者从已有本地路径读取
4. **解析转换**：
   - 读取源 JSON 文件，按 `poem.schema.json` 字段映射
   - 生成内容哈希 id（`p_<sha256(title|author|content)>[:12]`）
   - 追加写入 `.llm/entities/poem/records.jsonl`
   - 同时更新 `.llm/data/authors.json`（去重合并）
5. **输出导入报告**：
   - 共导入 X 首，新增 Y 首（去重后）
   - 覆盖 XX 朝代、XX 位诗人
   - 附带示例："已导入《静夜思》《春晓》等名篇"
6. 提示用户可用 `/index` 重建索引加速搜索

## 要点

- 导入可幂等重复，按 id 去重
- 原始 JSON 可保留在 `.llm/data/poems/source/` 作为备份引用
- 导入过程中保留源数据集的 `source` 和 `source_id` 字段
- 大规模导入（>1 万首）建议分批次，给用户进度反馈
