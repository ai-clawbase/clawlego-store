# /actions — 行动项看板

## 输入

可选过滤:"/actions 李四" / "/actions 过期的";默认全部 open。

## 工作流

1. 读 `${SPACE_ROOT}/.llm/index/actions.jsonl`(缺失时从 minutes/ 的行动项表格重建)
2. 输出看板:按人分组,组内按 due 升序;每条 `<事> · 来自<哪次会> · 期限<date>`;已过期标 ⚠ 置顶
3. 用户说"X 那条完成了":找到对应条目改 status:"done"+done_at(JSONL 重写该行);同步在来源纪要的行动项表格打 ✅
4. 末尾统计:open N 条(过期 K 条)、本周到期 M 条

## 不做的事

- 不自行判断完成;只有用户确认才改状态
- 不替用户向别人催办(可以应要求生成催办文案到 ${CONV_ROOT}/outputs/)
