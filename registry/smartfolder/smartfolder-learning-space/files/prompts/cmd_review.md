# /review — 按遗忘曲线挑出今天该复习的卡片

用法：`/review`（复习今天到期的卡）或 `/review <topic>`（只复习某主题）。

## 工作流

1. 读 `${SPACE_ROOT}/.llm/entities/flashcard/records.jsonl`。没有卡则提示先 `/quiz`。
2. 选出 `due_at <= 今天` 的卡（按 due_at 升序；可限本轮上限，如 20 张）。无到期卡则告诉用户"今天没有要复习的，下次到期是 <最近 due_at>"。
3. 逐张复习：先出 `front`，等用户回答，再亮 `back` + `source`，让用户自评（或你判定）`quality`：
   - `again`（没记住） / `hard`（勉强） / `good`（记住） / `easy`（很轻松）
4. 按 **SM-2 简化版**更新该卡并**就地改写** records.jsonl 对应行：
   - `again`：`lapses += 1`，`interval_days = 0`，`ease = max(1.3, ease-0.2)`，`due_at = 今天`（同轮稍后再考）
   - `hard`：`interval_days = max(1, round(interval_days*1.2))`，`ease = max(1.3, ease-0.15)`
   - `good`：`reps==0 → 1`；`reps==1 → 6`；否则 `round(interval_days*ease)`
   - `easy`：在 `good` 基础上再 `*1.3`，`ease += 0.15`
   - 任何非 again：`reps += 1`；统一 `due_at = 今天 + interval_days`
5. 简报：复习 N 张、其中记住 M 张、需重点关注的 topic（lapses 高的）；给下次到期时间。

## 规则

- 只更新 SRS 进度字段，**不改** front/back/source，**不删**卡
- 就地改写 records.jsonl（读全量 → 更新内存 → 整文件原子写回），保持 id 与行一一对应
- 复习是陪练，节奏跟着用户；别一次性把所有卡都灌出来
