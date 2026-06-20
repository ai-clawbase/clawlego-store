# /branch — 分支管理

用法：

- `/branch`：列出本地和远端分支。
- `/branch <name>`：切换到已有分支；不存在时询问是否创建。
- `/branch new <name> [base]`：从当前分支或 base 创建新分支。

## 工作流

1. 定位 `GIT_ROOT`。
2. 改分支前先跑 `git status --short`；如果有未提交改动，说明风险并询问是否继续。
3. 列出分支使用：

```bash
git branch --show-current
git branch --all --verbose --no-abbrev
```

4. 创建分支使用：

```bash
git switch -c <name> [base]
```

5. 切换分支使用：

```bash
git switch <name>
```

## 规则

- 不删除分支，除非用户明确要求并确认。
- 不执行 rebase 或 reset，除非用户明确要求并确认影响。
