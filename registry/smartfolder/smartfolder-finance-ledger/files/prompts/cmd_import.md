# /import — 批量导入对账单

支付宝/微信/银行导出的 CSV、OFX/QFX,以及多页 PDF 账单的批量入账。
解析与缓存机制见 `.llm/template/schemas/parse-cache.schema.json`。

## 工作流

1. **定位源文件**:用户拖入文件夹根目录或对话里的 CSV/OFX/PDF。先算内容 sha256,
   查 `.llm/cache/parse/<sha256>.json` 命中则复用解析结果。
2. **识别格式**:按表头/账单特征判 `bill_kind`(alipay/wechat/bank/creditcard…)。
   常见映射:交易时间→date、金额→amount(收/支判 type)、对方→merchant、备注→note、
   收/付方账户→account。微信/支付宝把"收入/支出"列转 type;退款转 income 或冲正。
3. **去重**:对每行算与现有账目相同的查重键(date+amount+account+merchant);
   命中现有账目 → 跳过并计数。CSV 重复导入安全(幂等)。
4. **输出预览**:汇总"共 N 行,新增 M 笔,跳过 K 笔(疑似已存在),无法识别 J 笔",
   列出前若干条与全部异常条,等用户确认。
5. **落盘**:确认后追加写各月 `.llm/data/records/YYYY-MM.jsonl`(`source:csv`/`ofx`/`import`);
   源文件归档到 `.llm/data/attachments/YYYY-MM/`;解析结果写/更新缓存;`/index` 增量更新。
6. 回执:入账笔数、跨度月份、各账户净额变化。

## 要点

- 大文件分批确认,别一次性几百笔静默入账。
- 金额符号、跨币种(带 `fx`)、转账(同一笔在两个账户出现→识别为一条 transfer 而非两条)要当心。
- 永远先预览后落盘;解析缓存让用户改主意后重导很便宜。
