# /sync — 同步远端

用法：

- `/sync`：先 fetch，再报告 ahead/behind 和推荐动作。
- `/sync pull`：拉取 upstream。
- `/sync push`：推送当前分支。

## 工作流

1. 定位 `GIT_ROOT`。
2. 先执行只读同步：

```bash
git fetch --all --prune
git status --short --branch
```

3. `/sync pull` 前：
   - 如果有未提交改动，先停止并说明需要 commit/stash。
   - 默认使用 `git pull --ff-only`，避免产生意外 merge commit。
4. `/sync push` 前：
   - 展示将推送的分支和 upstream。
   - 如果没有 upstream，建议 `git push -u origin <branch>` 并等待确认。
   - 不使用 force push，除非用户明确要求并确认。

## 规则

- 网络写操作前必须确认目标 remote 和 branch。
- pull 冲突时停止，输出冲突文件和下一步，不自动解决。
