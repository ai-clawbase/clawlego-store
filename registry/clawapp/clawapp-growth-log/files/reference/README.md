# WHO 生长参数表

`who_lms.json` 是这个应用算百分位的唯一数据来源，格式：

```json
{
  "weight_boy":  [{"month": 0, "l": ..., "m": ..., "s": ...}, ...],
  "weight_girl": [...],
  "height_boy":  [...],
  "height_girl": [...]
}
```

0–60 月龄，每个月龄一个点。

**它是随包发布的构建期资产，不是用户数据** —— 放在 `reference/` 而不是 `data/`，
所以升级时整块替换，用户自己的记录不受影响。

## 来源

WHO Child Growth Standards 的 LMS 参数，取自 WHO 自己在 GitHub 上维护的
`anthro` R 包所附原始表：

- `WorldHealthOrganization/anthro` → `data-raw/growthstandards/weianthro.txt`（体重别年龄）
- 同上 → `lenanthro.txt`（身长/身高别年龄）

选它而不是 who.int 的下载页，是因为那些页面只放 PDF 图表和会改路径的 xlsx
（本仓早先试过的几条 URL 现在全部 404），而这两个文件是纯文本、列名稳定、
由 WHO 组织自己维护。

原始表按**天**给点，应用按**月**查表，转换时对每个月龄取最接近
`month × 30.4375` 天的那一行。

**署名**：数值为世界卫生组织（WHO）发布的儿童生长标准参考值，版权归 WHO。
本应用代码为 MIT，参考数值按其原始来源署名使用，未作修改。

## 怎么重新生成

```bash
python3 scripts/fetch-who-lms.py
```

脚本会**自检**：拿到的表若与 WHO 公布的出生中位数（男 3.3464kg / 女 3.2322kg、
男 49.88cm / 女 49.15cm）对不上，就直接失败并且不写文件。

这条自检是刻意的：这些是医学参考值，家长会拿算出来的百分位判断孩子发育。
与其写出一份看起来像样的错表，不如失败。同理，脚本永远不会用估计值补齐缺口——
**一个编出来的百分位比没有百分位有害。**

表若为空或缺失，`percentile.risor` 会明确回答「还没有导入 WHO 生长参数表」，
不给出任何估计值。
