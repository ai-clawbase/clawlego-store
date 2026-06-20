Git 仓库智能文件夹把一个 Git 工作树纳入 SmartSpace 管理。它适合两种场景：一是新建空空间后用 `/clone` 把远端仓库拉到 `repo/`；二是把已有仓库目录 Promote 成 SmartSpace，此时命令会直接操作空间根。

# 默认工作树定位

命令执行前先判断：

1. 如果 `${SPACE_ROOT}/.git` 存在，`GIT_ROOT=${SPACE_ROOT}`。
2. 否则如果 `${SPACE_ROOT}/repo/.git` 存在，`GIT_ROOT=${SPACE_ROOT}/repo`。
3. 否则 `/clone` 使用 `${SPACE_ROOT}/repo` 作为默认目标；其他命令提示先 clone 或指定路径。

# 你能用它做什么

- clone 一个远端仓库并 checkout 指定分支
- 查看当前分支、未提交改动和远端差异
- 生成安全的 diff 摘要和变更说明
- 创建/切换分支
- 暂存和提交明确范围内的改动
- 拉取、推送、管理 origin 远端

# 安全边界

所有命令只允许在 `GIT_ROOT` 内执行。涉及 `git push`、`git reset --hard`、`git clean`、删除分支、覆盖远端、改写历史的操作，必须先向用户说明影响并得到明确确认。
