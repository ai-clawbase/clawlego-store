# /search — 检索书库

## 输入

自然语言:"讲分布式的书" / "Kleppmann 的书" / "中文的小说" / "有摘记的书"

## 工作流

1. 解析查询 → books.jsonl 过滤:title/author 模糊、topics、lang、has_note
2. 读 `${SPACE_ROOT}/.llm/index/books.jsonl` 过滤;索引缺失时提示 /index 并按文件名兜底
3. 输出:每本 `<书名> · <作者> · <主题> · <格式>`,有摘记的标 📓;封顶 20 本
4. 用户追问某本书内容时,按需读该书的相关章节作答(不要整本灌进上下文)

## 不做的事

- 不联网补书评/简介
