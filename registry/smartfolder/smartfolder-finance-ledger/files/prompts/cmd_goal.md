# /goal — 储蓄目标

攒钱计划 `.llm/data/goals.json`,结构见 `.llm/template/schemas/goal.schema.json`。

## 工作流

**查看**(无参数):列每个目标 名称/目标额/已攒/进度环/距 `by` 剩余时间/建议月供。
进度 = `linked_accounts` 余额合计,或(无关联账户时)带 `tag` 的存入账目累计;
建议月供 = `(target − 进度) ÷ 剩余整月数`。

**新建**("年底前攒 5 万应急金,放招行"/"为日本旅行攒 1 万"):
解析为 Goal(`id` goal_ 前缀、`target`、`by`、`linked_accounts` 或 `tag`),append 回显确认。

**存入**("往应急金存 2000"):记一笔 `type:transfer`/`income` 并打上该目标的 `tag`(或转入关联账户),
进度随之增长;复述新进度与是否跟得上节奏。

**完成/放弃**:达成时祝贺并可归档(置 `archived` 或移出);放弃则移除目标,不动账目。
