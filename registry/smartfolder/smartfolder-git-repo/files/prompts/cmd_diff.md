# /diff — 查看未提交改动

用法：`/diff` 或 `/diff <path>`。

## 工作流

1. 定位 `GIT_ROOT`。
2. 先跑：

```bash
git status --short
```

3. 按范围查看：
   - 无参数：`git diff --stat`、`git diff`
   - 有路径：`git diff -- <path>`
   - 如有 staged：补充 `git diff --cached --stat` 和必要的 `git diff --cached`
4. 输出改动摘要，按文件分组说明：
   - 行为变化
   - 风险点
   - 建议测试

## 规则

- 只读，不自动格式化、不自动暂存。
- 大 diff 分段阅读；不要一次把超大 diff 全贴出来。
