---
name: crosscheck_research
description: 多角度并行调研 + 交叉投票 —— 对一个问题派多个子代理独立检索，再交叉验证去伪存真
inputs:
  - key: question
    label: 研究问题
    field_type: textarea
    required: true
    placeholder: 一个具体、可验证的问题
  - key: angles_hint
    label: 角度提示
    field_type: textarea
    required: false
    placeholder: 留空就让 orchestrator 自行拆 3-5 个角度
  - key: source_pref
    label: 信源偏好
    field_type: select
    required: false
    default: balanced
    options:
      - academic
      - industry
      - news
      - balanced
outputs:
  - outputs/research-report.md
  - outputs/sources.md
  - outputs/findings/angle-{n}.md
steps:
  - 阶段 A · 拆角度：把 question 拆成 3-5 个独立可检索的角度，列入 research-report.md "拆角度"段
  - 阶段 B · 角度并行检索：每个角度派发一个 Task 子代理独立检索 + 摘要 + 引证，各写 findings/angle-N.md
  - 阶段 C · 交叉投票：把每条声明在所有角度文件里查一遍，留下被 2+ 角度独立支持的；标记孤证
  - 阶段 D · 报告：写 research-report.md，每条结论附"被哪几个角度支持"与原始引用；sources.md 汇总信源
starter_prompts:
  - 请按 crosscheck_research 工作流推进，多角度交叉验证
examples:
  - "Node.js v20 与 v22 之间 permission model 变了什么"
  - "国内长护险 2026 年试点城市扩围情况"
trigger:
  kind: manual
allowed_tools:
  - WebSearch
  - WebFetch
  - Read
  - Write
  - Edit
  - Task
---
# crosscheck_research · 多角度并行 + 交叉验证

研究型工作流的核心问题不是"找到信息"，而是"分辨哪条可信"。把检索 fan 出去给独立子代理，**互不知情**地从不同角度找证据，回来再用"被多少角度独立支持"来投票筛选——这是仿照 Claude Code 官方 `/deep-research` 的范式。

## 派发模式

阶段 B 对每个角度发一个 `Task`：

- `Task(description: "angle 1: regulatory view", prompt: "围绕 <question> 从监管/政策角度独立检索，给出 5-8 条带引用的发现。落 outputs/findings/angle-1.md。不参考别的角度")`
- `Task(description: "angle 2: industry view",   prompt: "围绕 <question> 从产业 / 公司年报 / 招股书角度独立检索。落 outputs/findings/angle-2.md")`
- `Task(description: "angle 3: academic view",   prompt: "围绕 <question> 从学术论文 / 权威报告角度独立检索。落 outputs/findings/angle-3.md")`
- ...

并行结果回来，阶段 C 的**交叉投票**才是 orchestrator 真正的工作：相同声明出现在几个角度文件里？只出现在一处的标"孤证"。

## 产物约定

`outputs/research-report.md` 每条结论必须标注被几个角度支持；`outputs/sources.md` 是所有引用的扁平清单，方便二次复核。
