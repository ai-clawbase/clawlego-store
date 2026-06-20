# /clone — 克隆远端仓库

用法：`/clone <repo-url> [branch]`。

## 工作流

1. 解析参数中的仓库 URL 和可选分支。
2. 判断目标：
   - `${SPACE_ROOT}/.git` 已存在：这是已有仓库，不执行 clone；改为检查 origin 是否匹配。
   - `${SPACE_ROOT}/repo` 不存在或为空：clone 到 `${SPACE_ROOT}/repo`。
   - `${SPACE_ROOT}/repo` 已存在但不是 Git 仓库且非空：停止并请用户指定空目录或确认处理。
3. 执行：

```bash
git clone <repo-url> "${SPACE_ROOT}/repo"
```

4. 如果提供分支，在 `GIT_ROOT` 内执行：

```bash
git checkout <branch>
```

5. 输出 clone 结果：当前分支、remote、最近一次提交、下一步可用命令。

## 规则

- 不使用 `git clone --recursive`，除非用户明确要求。
- 不覆盖已有非空目录。
- 如果需要凭证，提示用户配置 credential helper 或使用已有认证；不要让用户把 token 明文贴进仓库文件。
