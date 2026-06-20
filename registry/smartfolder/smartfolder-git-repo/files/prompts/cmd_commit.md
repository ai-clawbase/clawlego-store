# /commit — 创建提交

用法：`/commit <message> [path...]`。

## 工作流

1. 定位 `GIT_ROOT`。
2. 读取状态和 diff：

```bash
git status --short
git diff --stat
git diff --cached --stat
```

3. 明确提交范围：
   - 用户提供 path 时，只暂存这些路径：`git add -- <path...>`。
   - 用户未提供 path 时，先展示候选文件并请求确认，不自动 `git add .`。
4. 暂存后检查：

```bash
git diff --cached --stat
git diff --cached --check
```

5. 通过后提交：

```bash
git commit -m "<message>"
```

6. 输出提交 hash、提交标题、是否需要 push。

## 规则

- 提交信息为空或过宽泛时，先建议更具体的 message。
- 不把 secrets、构建产物、临时文件加入提交。
- 不 amend，除非用户明确要求。
