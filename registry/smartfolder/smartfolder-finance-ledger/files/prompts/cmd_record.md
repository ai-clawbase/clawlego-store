# /record — 入账

字段约定见 persona 与 `.llm/template/schemas/transaction.schema.json`。

## 三种输入

- **A. 口述**:"昨天打车 38,午饭 25 走支付宝" → 解析成多笔;相对日期按今天换算;
  币种缺省用实例 `fields.currency`;账户缺省用上次用的或默认账户。
- **B. 截图/PDF**(支付宝/微信/银行/小票):见「解析与缓存」。
- **C. CSV 对账单**:走 `/import` 的逻辑;小量也可在此直接处理。

## 工作流

1. 解析输入为账目行。`type` 判向(支出/收入/转账);`category` 按 `.llm/data/categories.json` 归类,
   拿不准标"其他"并在清单标注;识别到账户名(支付宝/招行…)映射到 `accounts.json` 的 id。
2. **输出入账清单**让用户过目:`<日期> <金额> <账户> <分类> <商户/备注>`。
   批量来源(B/C)必须等确认;口述(A)金额清晰时可直接入。
3. 查重:`id` 是内容哈希主键(`t_ + sha256(date|amount|type|account|merchant|seq)`),
   同键即同笔 → 写入实体库时按 `id` 去重(存在即合并、不新增),天然挡住重复入账;
   仅当字段不同（金额/商户改了）才算新笔。
4. 写入 **scoped 实体库** `.llm/entities/transaction/records.jsonl`(真相层,只追加)。
   用 `entity.upsert("transaction", rows)` 入账——按 `id` 去重、自带写入校验,免 LLM。
   若不可用,直接追加到 `records.jsonl`(JSON Lines,格式与 `_schema.json` 一致);
   事后可用 `entity.import_jsonl` 批量去重归正。**不要**写旧的 `.llm/data/records/YYYY-MM.jsonl`
   (那是历史迁移源/备份,见 `/migrate`)。
5. 入账后顺手增量更新 `.llm/index/monthly.json`、`accounts_balance.json` 并刷新 `records_digest`。
6. 报一句总账:"已入 N 笔,合计 -XXX;本月餐饮已用 xx%(预算存在时);现金账户余额 …"。

## 解析与缓存(截图/PDF)

- 先算源文件内容 sha256 → 查 `.llm/cache/parse/<sha256>.json`(见 parse-cache.schema)。
  命中且 `parser_version >= min_parser_version` → 直接复用,跳过重解析。
- 未命中 → 解析,写缓存(带 `parser_version`、`media`、`bill_kind`、候选 `result.transactions`)。
- 解析出的只是**候选账目**,确认后才入 records。原图归档到 `.llm/data/attachments/YYYY-MM/<sha256>.<ext>`,
  账目 `attachments` 记该相对路径。根目录的原始拖入文件处理后移走,保持根目录干净。

## 不做的事

- 不改写历史行(更正用冲正,见 persona)。
- 识别失败的图/CSV 说明原因并留档,不静默跳过。
