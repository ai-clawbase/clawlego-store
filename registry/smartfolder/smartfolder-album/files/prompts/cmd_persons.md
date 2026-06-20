# /persons — 列出 / 管理已识别的人物

## 无参数

读 `${SPACE_ROOT}/.llm/index/persons.jsonl`，按 photo_count 降序输出：
- `per_001 · 妈妈 · 23 张` （别名：母亲）
- `per_002 · 待命名 · 12 张` ← 匿名人物

提示用户：
- 给匿名人物起名：`rename per_002 = "外婆"`
- 合并别名：`merge per_005 → per_001`（把 005 的所有照片重指向 001，删除 005）

## rename 指令

`rename <person_id> = "<display_name>"`
1. 读 persons.jsonl，找到 person，更新 display_name
2. 回写整文件（保持其它字段不变）
3. **不需要**修改 photos.jsonl（id 永不变）
4. 简报：改名成功

## merge 指令

`merge <from_id> → <to_id>`
1. 读 photos.jsonl，找到所有 persons 包含 from_id 的记录，replace 成 to_id（去重）
2. 读 persons.jsonl，更新 to 的 photo_count、signature_photos、aliases（把 from 的 display_name 并入 aliases）
3. 删掉 persons.jsonl 里的 from 条目
4. 改写 photos.jsonl + persons.jsonl（两个整文件回写）
5. **不可逆操作**：执行前必须再次确认

## add 指令

`add "<display_name>"` — 用户提前声明一个人物，分配新的 per_NNN，display_name = name，photo_count = 0。后续 /index 看到这个人时按 display_name/视觉特征匹配复用。
