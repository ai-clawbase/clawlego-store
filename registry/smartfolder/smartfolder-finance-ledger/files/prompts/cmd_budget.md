# /budget — 预算管理

信封式预算,结构见 `.llm/template/schemas/budget.schema.json`,存于 `.llm/data/budget.json`。

## 工作流

**查看**(无参数):读 `budget.json` + 当月账目,每类输出 已用/预算/剩余/进度条;
按超支风险排序——`(已用/limit) ÷ (当月已过天数/当月总天数) > alerts.pace_ratio` 的标 ⚠。
有 `total_limit` 时也给总额进度。`rollover:true` 的类把上月结余计入剩余。

**设置**("餐饮 1500,交通 600,房租结转"):
1. 解析为 `categories[类] = { limit, rollover }`,合并写入 `budget.json`,补 `schema_version:2`、
   `currency`、`alerts` 默认、`updated_at`。
2. 回显完整预算表确认。

**取消**("不盯餐饮了"):从 `categories` 移除该类(不动其历史账目)。

## 不做的事

- 预算只在 /record 与 /report 时顺带对照提醒;不主动反复唠叨。
- 不自动调整用户设的额度。
