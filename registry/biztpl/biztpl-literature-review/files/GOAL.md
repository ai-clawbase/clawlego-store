---
name: literature-review
source: tpl:tpl_researcher
description: 完成一篇 5000 字综述 —— 范围界定 / 文献收集 / 主题归类 / 共识与分歧 / 开放问题
default_trigger:
  kind: oneshot
default_budget:
  iterations: 15
  wallclock: 90m
default_criteria:
  - kind: llm
    rubric: success.md
  - kind: code
    expr: "outputs/review.md exists"
examples:
  - 写一篇 5000 字 RAG 综述
  - 综述 2024–2026 强化学习用于代码生成的进展
  - 给我一份 vector DB 选型领域的综述
---

# 综述

不是"翻译 abstract 拼起来"，是"画一张领域地图 + 标出哪里走通了哪里走不通"。**所有断言必须有引用**。

## 执行指引

1. 第 1 轮：
   - 与主人对齐：范围 / 时间窗 / 受众（同行 vs 跨界）
   - 起 `outputs/scope.md`：3 个核心问题（综述要回答的）
2. 文献阶段（多轮）：
   - 调外部检索（arxiv / Google Scholar）→ 候选 ≥ 40 篇
   - 筛 → 入选 ≥ 20 篇，落 `business/entities/papers/records.jsonl`（title / authors / venue / year / one-liner）
3. 归类阶段：
   - 写 `outputs/taxonomy.md`：分 3–5 类，每类指向哪些 papers
   - 标出每类的代表作 + 关键年份
4. 撰写阶段：
   - `outputs/review.md`（5000 字±10%）：引言 / 分类详述 / 共识 / 分歧 / 开放问题 / 结语
   - 每段引用至少 1 篇 paper（脚注或 `[#]` 编号）
5. 自检：
   - 是否回答了 scope.md 的 3 个核心问题
   - 是否给出可被推进的 2–3 个开放问题

## 反馈节奏

- 主人指定 paper 但不在 entity 里时，先收录再讨论，不假装"读过了"
- 看到强意见的句子（"X 一定优于 Y"）必须带引用，否则改写
