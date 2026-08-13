# DevDeck

以任务为中心的开发者工具、命令、OCI 镜像、配置模板与分步指南工作台。

在线访问：<https://tools.15587117.xyz/>

DevDeck 不只是展示一条命令，而是同时说明：

- 什么时候适用；
- 对应什么操作系统、Shell 或软件版本；
- 执行前应该检查什么；
- 有哪些风险；
- 如何确认成功；
- 出错或需要撤销时怎么处理。

## 当前内容

- 8 个浏览器本地工具；
- Git、Docker、Kubernetes、curl、SSH 与 OpenSSL 命令方案；
- PostgreSQL、Valkey、Nginx、Caddy、MinIO、Mailpit 等 OCI 镜像配方；
- Nginx、Caddy、Node.js Dockerfile 与 GitHub Actions 配置模板；
- PostgreSQL 开发环境、502 排查、Node.js 容器化、Git 恢复和本地邮件测试指南；
- 全局中文/英文混合搜索；
- 深浅主题、本地收藏与响应式界面。

所有在线工具默认在浏览器本地处理输入。

## 本地开发

要求：Node.js 22 或更高版本。

```bash
npm install
npm run dev
```

默认开发地址由 Vite 输出，通常为 `http://localhost:5173`。

## 验证

```bash
npm run check
npm test
npm run build
```

生产构建输出到 `dist/`。

## 部署到 Cloudflare Workers Static Assets

项目使用 Cloudflare 当前推荐的 **Workers Static Assets** 部署方式。MVP 是纯静态应用，静态请求不会进入 Worker 代码，也不需要额外绑定。

### 方式一：命令行直接部署

首次使用需要登录 Cloudflare：

```bash
npx wrangler login
```

然后运行：

```bash
npm run deploy
```

`wrangler.jsonc` 已设置静态资源目录与 SPA 路由回退：

```jsonc
{
  "name": "devdeck",
  "assets": {
    "directory": "./dist",
    "not_found_handling": "single-page-application"
  }
}
```

Wrangler 会先构建，再将 `dist/` 发布为 Worker 静态资源。

### 方式二：Cloudflare Dashboard 连接 GitHub

当前生产环境已连接 `WinsPan/DevDeck` 的 `main` 分支，推送后由 Workers Builds 自动构建与发布。首次在其他 Cloudflare 账号复用时：

1. 打开 Cloudflare Dashboard；
2. 进入 **Workers & Pages → Create → Import a repository**；
3. 选择 `WinsPan/DevDeck`；
4. 使用以下设置：

```text
Build command: npm run build
Deploy command: npx wrangler deploy
Node.js version: 22 或更高
```

每次推送默认分支后会自动发布，其他分支可以生成 Preview Version。

## 路由与缓存

- `wrangler.jsonc` 使用 SPA 回退，使 React Router 的详情页在直接访问时可正常加载；
- `public/_headers` 为哈希静态资源设置长期缓存，并添加基础安全响应头；
- 应用目前不需要 D1、KV、R2 或 Secret；
- 后续增加 `/api/*` 时，可在同一个 Worker 中加入 API 入口并保留静态资源架构。

## 内容维护

MVP 内容集中在：

```text
src/data/resources.ts
```

每条资源包含：

- 类型与唯一 slug；
- 中文标题、英文名与搜索别名；
- 适用平台和版本；
- 最后验证日期；
- 主要来源；
- 风险等级；
- 正文、步骤与多平台代码块。

新增条目时请优先引用官方文档，并实际验证命令。不要使用“安全”“推荐”“最新版”等无法证明或容易失效的描述。

## 产品原则

1. 不在网页内执行用户命令；
2. 危险操作优先给出只读检查和备份方法；
3. Secret 使用 Web Crypto 在本地生成；
4. 命令示例使用明显占位符，不伪装成可无脑执行；
5. 镜像与版本信息必须可追溯至上游来源；
6. 首页以任务搜索为主，不退化成网址导航或卡片墙。

## License

尚未指定。公开发布前请根据项目目标补充许可证文件。
