# /account — 账户与净值

账户簿 `.llm/data/accounts.json`,结构见 `.llm/template/schemas/account.schema.json`。

## 工作流

**查看**(无参数):列每个账户 名称/类型/当前余额(= `opening_balance` + 该账户全部账目净额,
**实时算出,从不存死余额**),底部给**总净值**(各账户余额折本位币合计;信用卡为负债)。
读 `.llm/index/accounts_balance.json`,不新鲜先重建。

**建账户**("我有招行储蓄卡、一张交行信用卡额度 3 万、支付宝余额 500"):
1. 逐个映射到 `type`(cash/bank/credit_card/alipay/wechat/prepaid/investment/receivable/other),
   给稳定 `id`(`acc_` 前缀)、`icon`、`order`;有初始余额写 `opening_balance`;
   信用卡填 `credit:{credit_limit,bill_day,repay_day}`。
2. append 到 `accounts.json`,回显账户表确认。

**转账**("从招行转 2000 到支付宝"):写一条 `type:transfer` 账目,`account`=出、`to_account`=入,
不计收支只动两边余额。

**对账/调整**("现金实际还剩 80"):写一条 `type:adjust` 账目补差额,`note` 注明对账,使账面=实际。

**停用**("交行卡注销了"):置 `archived:true`,保留历史,不物理删除。

## 不做的事

- 不直接改写余额数字(余额是派生的);要改就记一笔 adjust。
