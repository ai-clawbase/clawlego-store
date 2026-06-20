# 迁移 v1 → v2.0.0

把 v1(单账户、随口记)升级到 v2(多账户/转账/标签/报销/周期账单/储蓄目标/多币种/净值)。
**旧账目零改写、零丢失。** 全部步骤幂等可重跑。

适用:`.llm/data/_template.json` 缺失,或其 `template_version < 2.0.0`。

---

## 0. 备份(manifest.backup=true)

- 创建 `.llm/backups/v1-<YYYYMMDD-HHMMSS>/`,复制 `.llm/data/records/` 整目录与 `.llm/data/` 整目录进去。
- 已存在同前缀今日备份则跳过(幂等)。

## 1. 账户簿 accounts.json(新增)

- 若 `.llm/data/accounts.json` 不存在 → 按 `schemas/account.schema.json` 创建,本位币取实例
  `fields.currency`(默认 CNY),种入一个默认账户:
  `{ "id":"acc_default","name":"默认","type":"cash","currency":<本位币>,"opening_balance":0,"order":0 }`。
- 已存在 → 跳过(不动用户已建账户)。
- **旧账目无 account 字段**:不回改;`transaction.schema` 规定读取方对缺 account 的行按 `acc_default` 处理。

## 2. 分类法 categories.json(新增)

- 不存在 → 写默认分类法(支出/收入两级 + 图标),内容取自随模板分发的种子 `.llm/template/seed/categories.json`。
- 已存在 → 保留;仅把种子分类里用户还没有的**追加**进去,不删用户改动。

## 3. 其余设置文件(新增,缺则建空)

- `.llm/data/budget.json`:不存在则建空预算(categories:{} )。**若存在 v1 旧 budget.json**
  (形如 `{"currency","monthly":{类:额}}`)→ 转成 v2 形状:
  `monthly` 的每项 `类:额` ⇒ `categories[类] = { "limit":额, "rollover":false }`,补 `schema_version:2`、
  `alerts:{warn_ratio:0.8,pace_ratio:1.2}`。保留 currency。
- `.llm/data/recurring.json`:不存在则 `{ "schema_version":2, "items":[] }`。
- `.llm/data/goals.json`:不存在则 `{ "schema_version":2, "goals":[] }`。

## 4. 目录补齐

- 确保存在:`.llm/data/attachments/`、`.llm/cache/parse/`、`.llm/index/`。
- v1 的 `.llm/index/summary.json`(老聚合缓存)→ 删除(第 6 步会按 v2 结构重建);其内容不是真相,可弃。

## 5. 写模板状态 _template.json

- 写 `.llm/data/_template.json`(见 schemas/template-state.schema.json):
  - `kind:"finance_ledger"`, `template_version:"2.0.0"`, `data_schema_version:2`
  - `created_with`:沿用旧值;旧实例无则填 `"1.0.0"`
  - `migrated_at`:现在;`history` 追加 `{ "to":"2.0.0","at":现在,"migration":"v1-to-v2","by":"upgrade" }`

## 6. 重建派生层(manifest.rebuild_index=true)

- 清空 `.llm/index/`,执行 `/index` 全量重建(monthly / accounts_balance / 等)。
- 解析缓存 `.llm/cache/parse/` **不动**:按内容哈希寻址,v1 时期解析过的账单图在 v2 仍命中复用。

## 7. 收尾汇报

一句话告诉用户:升级到 v2 完成,新增了哪些能力,旧账目 N 笔全部保留,备份在哪。
列出可立刻试的新命令:`/account`(建你的真实账户)、`/recurring`(房租工资订阅)、`/report`(净值与现金流)。

---

## 兼容性自检(跑完应满足)

- [ ] `.llm/data/records/*.jsonl` 的行数与升级前一致(无删改)。
- [ ] 旧账目在 /report 里仍能统计(缺字段按默认解释)。
- [ ] `_template.json.template_version == 2.0.0`。
- [ ] `.llm/index/_index.json.records_digest` 与当前 .llm/data/records/ 相符(新鲜)。
- [ ] 重跑本迁移不产生重复账户/重复分类(幂等)。
