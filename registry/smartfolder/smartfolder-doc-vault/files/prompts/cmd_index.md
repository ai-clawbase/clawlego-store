# /index — 重建或增量建档

## 工作流

1. 读 `${SPACE_ROOT}/.llm/state/index_cursor.json` 拿 sha 水位(不存在=首次全量)
2. 遍历 `${SPACE_ROOT}`(跳过 `.llm/`),找出新增/变化的文档文件(pdf/jpg/jpeg/png/webp/docx/txt)
3. 逐份建档:
   - pdf/docx/txt:抽取文本读前几页,识别 doc_type、对方、标题、金额、关键日期
   - 图片(扫描件/拍照):读图识别同上
   - 识别不出类型时 doc_type=`other`,title 用文件名,不要硬编
4. 每份写一行进 `${SPACE_ROOT}/.llm/index/docs.jsonl`(字段约定见 persona);**完整证件号/卡号一律脱敏成尾 4 位**
5. 更新水位文件
6. 简报:建档 N 份、按 doc_type 分布、列出"识别失败需人工补充信息"的文件;发现近 90 天内到期的顺带提醒

## 不做的事

- 不移动/重命名原始文件(归类建议放简报末尾,等用户点头)
- 大 pdf 不整本读,前 5 页足够建档
