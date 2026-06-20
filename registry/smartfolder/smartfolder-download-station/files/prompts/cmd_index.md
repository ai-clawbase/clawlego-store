# /index — 盘点下载目录

## 工作流

1. 读水位 `${SPACE_ROOT}/.llm/state/index_cursor.json`(指纹用 path+size+mtime,大文件不算 sha)
2. 遍历 `${SPACE_ROOT}`(跳过 `.llm/`),顶层条目为单位盘点(一个种子目录算一个条目,不拆到内部文件)
3. 逐条识别 kind/status,并预填 suggest(归类去向或清理理由,见 persona 词汇)
4. 写 `${SPACE_ROOT}/.llm/index/items.jsonl`,更新水位
5. 简报:总条目/总体积、按 kind 与 status 分布、`incomplete` 几个、`stale` 占多少 GB;末尾提示可跑 /sort、/clean

## 不做的事

- 只盘点不动手;suggest 只是预判,执行归 /sort 和 /clean
- 不读文件内容(文件名/扩展名/目录结构足够分类;个别拿不准的标 other)
