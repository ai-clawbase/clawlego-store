# /index — 重建或增量建库

## 工作流

1. 读 `${SPACE_ROOT}/.llm/state/index_cursor.json` 拿 sha 水位(不存在=首次全量)
2. 遍历 `${SPACE_ROOT}`(跳过 `.llm/` 与 `notes/`),找出新增/变化/删除的书文件
3. 逐本识别:
   - epub:读 OPF 元数据(title/creator/language)
   - pdf:读首页与版权页推断
   - 文件名兜底:`作者 - 书名.epub` 等常见格式
   - topics:按内容/书名归 1-3 个主题词,拿不准就少给
4. 写 `${SPACE_ROOT}/.llm/index/books.jsonl`(字段约定见 persona);`has_note` 按 `notes/<id>.md` 是否存在回填
5. 更新水位;简报:新增 N 本、按主题分布、识别失败清单(列原始文件名)

## 不做的事

- 不整本读书;元数据+目录页足够建库
- 不动书文件本体
