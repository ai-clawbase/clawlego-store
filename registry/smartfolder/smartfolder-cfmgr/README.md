# CF Manager

CF Manager 是一个自带 Cloudflare 连接能力的增强型智能文件夹。安装后，在「智能文件夹」里新建 CF Manager、输入 Cloudflare API Token；账号信息初始化成功后，它会自动同步并在本地工作台展示：

- Token 可见的全部 Cloudflare 账号
- Workers scripts 与 deployments
- Pages projects 与近期 deployments
- `workers.dev` / `pages.dev` 端点健康探测
- Account subscriptions
- Workers GraphQL Analytics 运营用量摘要
- 同步状态、warning 与 Pages 管理动作审计

## 安全边界

Token 创建时一次性写入 workspace Vault；智能文件夹只保存随机 `vault:` 引用。内置脚本拿不到 Token 明文，只能要求宿主把凭据附加到 `https://api.cloudflare.com`，健康探测不会携带凭据。无需安装或配置独立 Cloudflare Connector，也不建议使用 Global API Key。

建议从只读权限起步：账号读取、Workers Scripts Read、Pages Read；订阅和 Analytics 页面需要对应的 Billing/Analytics 读取权限。只有准备使用 Pages retry/rollback 时才增加 Pages Write。权限不足的产品面会降级成 warning，不会删除上次成功快照。

Cloudflare API Token 创建方式见 [官方文档](https://developers.cloudflare.com/fundamentals/api/get-started/create-token/)。

## 常用命令

- `/sync`：立即同步远端状态
- `/panel`：打开多页管理工作台
- `/projects`、`/health`、`/billing`：查看本地快速摘要
- `/inspect <entity> <id>`：检查完整缓存记录
- `/retry CONFIRM <account_id> <project_name> <deployment_id>`
- `/rollback CONFIRM <account_id> <project_name> <deployment_id>`

所有远端变更都要求显式 `CONFIRM`，并写入本文件夹的 operation 审计。Workers 上传、删除、路由和 secret 变更在 1.0.0 中默认不开放。

## 关于“计费”

Subscriptions 是账号订阅信息；Workers GraphQL Analytics 适合运营观测，但 Cloudflare 明确说明 Analytics datasets 不能作为实际计费量。CF Manager 会把它标记为“非计费权威”，不冒充发票；最终金额仍以 Cloudflare Billing 为准。参见 [Cloudflare GraphQL Analytics 文档](https://developers.cloudflare.com/analytics/graphql-api/)。
