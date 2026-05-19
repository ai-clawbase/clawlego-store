# 网络调研资产包 · ClawMod

让任意智能体具备结构化的联网调研能力。

ClawMod 是 **智能资产包**——把若干传统智能资产（提示词 / 技能 / MCP / 知识库 / subagent / tools）打成一个可整体安装的单元。它不带人格，装在任何已有的 Agent 上即可生效。

## 包含什么

| 类型 | 资产 | 说明 |
|---|---|---|
| Skill | `skills/web-research` | 结构化调研流程 |
| Prompt | `prompts/research-brief.md` | 调研简报输出模板 |
| MCP | `mcp/fetch.json` | fetch MCP 服务配置 |
| Knowledge | `knowledge/source-quality.md` | 信息源可信度分级 |

## 安装去向

整包解压到 `business/assets/mods/clawmod-web-research/`。
ClawLego 安装时会把其中的 MCP 配置合并进实例的 MCP 注册表，技能与提示词登记进资产索引。

## 许可

MIT。
