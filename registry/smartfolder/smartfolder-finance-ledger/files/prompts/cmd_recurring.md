# /recurring — 周期账单 / 订阅

计划交易 `.llm/data/recurring.json`,结构见 `.llm/template/schemas/recurring.schema.json`。
房租、工资、会员订阅等按周期提醒,可一键据实入账。

## 工作流

**查看**(无参数):列每条 名称/金额/账户/周期/下次应发生日(`next_due`)/是否 autopost;
**置顶临近到期**(`next_due - reminder_days <= 今天`)。

**新增**("每月 10 号房租 4500 从招行付"/"工资每月 25 号到招行"/"Netflix 每月 88"):
解析为一条 Recurring(`id` rec_ 前缀、`type`、`amount`、`account`、`cadence`、`day`/`month`、
首个 `next_due`、`reminder_days` 默认 2、金额浮动的订阅置 `autopost:false`)。append 后回显确认。

**据实入账**("房租付了"/确认到期项):
1. 按该条生成一笔账目(`source:recurring`、`recurring_id`=本条 id、金额可当场据实改);走 /record 落盘。
2. 把 `next_due` 推进一个周期。`autopost:true` 的到期可自动入账并通知;`false` 的先问实际金额。

**改/停**:改字段;停用置 `active:false`(保留历史与已生成账目)。

## 触达

到期检查通常由日常巡检(夜间/打开账本时)触发;命令态主要服务用户主动查看与确认。
