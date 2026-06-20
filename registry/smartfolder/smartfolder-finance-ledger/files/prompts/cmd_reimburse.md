# /reimburse — 报销跟踪

账目上的 `reimbursable` / `reimbursed` / `reimburse_id` 字段(见 transaction.schema)驱动,
不引入新文件——报销状态是账目的属性。

## 工作流

**标记可报销**("这笔打车要报销"/入账时说"可报销"):给对应账目置 `reimbursable:true`。
注意:历史行不改写——用一条 `void_of` 冲正原行 + 一条带 `reimbursable:true` 的更正行;
或在入账当时就带上该字段(优先)。

**查看待报销**(无参数或"待报销"):列所有 `reimbursable:true && !reimbursed` 的账目,
按日期/项目/`tags` 分组,给合计金额。可生成报销单 → 写 `${SPACE_ROOT}/llm_output/reimburse-<日期>.md`
(明细 + 合计 + 附件路径清单),方便贴发票。

**结算到账**("报销的 1200 到账了"):
1. 给这批账目置 `reimbursed:true`、同一 `reimburse_id`(本批次 id);历史行用更正行方式。
2. 记一笔 `type:income`、`category:报销`、`reimburse_id` 相同的入账,体现钱回到账户(净支出归零)。
3. 回执:本批 N 笔、原垫付合计、已到账金额。

## 要点

- 报销的本质:垫付时是支出,结算时是收入,两者用 `reimburse_id` 串起来对消。
- 不把"可报销支出"从支出统计里悄悄抹掉;在 /report 里单列"其中可报销/已报销"。
