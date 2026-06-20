# /search — 检索影视库

## 输入

自然语言:"有没有《沙丘2》" / "2024 年的科幻片" / "4K 的电影有哪些" / "缺集的剧"

## 工作流

1. 解析查询 → titles.jsonl 过滤:title/original_title 模糊、year、genre、files.resolution、episodes.missing 非空
2. 读 `${SPACE_ROOT}/.llm/index/titles.jsonl` 过滤;索引缺失时提示 /index 并用文件名 find 兜底
3. 输出:每条 `<片名> (<年份>) · <类型> · <最高清晰度> · <相对路径>`;剧集追加 `已有 S04E1-3,5 缺 E4`;封顶 25 条
4. 命中多版本时列出全部版本与体积,方便用户挑着删

## 不做的事

- 不联网查评分/简介(本地库只答本地有什么;用户要影评另起话题)
