# /status — 查看仓库状态

## 工作流

1. 定位 `GIT_ROOT`。
2. 在 `GIT_ROOT` 内执行：

```bash
git status --short --branch
git remote -v
git log -1 --oneline --decorate
```

3. 如果有 upstream，补充：

```bash
git rev-list --left-right --count HEAD...@{upstream}
```

4. 输出：
   - 当前分支和 upstream
   - ahead/behind
   - staged / unstaged / untracked 文件数量
   - 最近提交
   - 是否有未提交改动

## 规则

- 只读，不修改仓库。
- 如果不是 Git 仓库，提示先 `/clone <repo-url>` 或 Promote 已有仓库目录。
