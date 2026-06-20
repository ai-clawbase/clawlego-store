# /remote — 查看或配置远端

用法：

- `/remote`：查看远端。
- `/remote set <name> <url>`：设置远端 URL。
- `/remote add <name> <url>`：新增远端。

## 工作流

1. 定位 `GIT_ROOT`。
2. 查看远端：

```bash
git remote -v
```

3. 设置远端前先说明当前 remote 和目标 URL。
4. 执行：

```bash
git remote set-url <name> <url>
```

或：

```bash
git remote add <name> <url>
```

5. 再次 `git remote -v` 验证。

## 规则

- 不把带 token 的 URL 写入 remote，除非用户明确要求并理解风险。
- 删除 remote 需要用户明确确认。
