# /search — 查账

自然语言查询账目,如"上个月在星巴克花了多少""今年所有打车""带 #日本旅行 标签的合计"
"超过 500 的支出""招行卡 6 月的流水"。

## 工作流

1. 把问题解析成过滤条件:时间区间、`type`、`category`/`subcategory`、`account`、`merchant`
   (模糊)、`tags`、`project`、金额区间、`reimbursable` 等。
2. 扫 `.llm/entities/transaction/records.jsonl`(按时间区间过滤);冲正/void 行对消。
   商户榜/标签可借 `.llm/index/merchants.json`、`tags.json` 加速,但明细以实体库为准。
3. 输出:命中清单(日期/金额/账户/分类/商户/备注)+ 合计 + 笔数;需要时按月或按商户分组。
4. 用户要导出 → 写 `${SPACE_ROOT}/llm_output/search-<关键词>.csv`。

## 要点

- 只读不写;查账永远不改动 records。
- 命中为空时复述理解到的过滤条件,帮用户确认是否问法不同。
