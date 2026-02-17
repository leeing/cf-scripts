# cf-scripts

Cloudflare Worker 脚本分发服务 — 通过自定义域名一键运行远程脚本。

```bash
curl -sL https://s.qadmlee.com/check.py | python3 - -4
```

## 技术栈

| 项目 | 选择 |
|------|------|
| 语言 | TypeScript（strict） |
| 运行时 | Cloudflare Workers |
| 包管理 | pnpm |
| Lint/Format | Biome |
| 测试 | Vitest + @cloudflare/vitest-pool-workers |
| 部署 | Wrangler CLI |

## 项目结构

```
cf-scripts/
├── src/
│   └── index.ts           # Worker 入口
├── test/
│   ├── index.test.ts      # 测试用例
│   └── tsconfig.json      # 测试 TS 配置
├── wrangler.jsonc          # Worker 配置
├── vitest.config.ts        # Vitest 配置
├── biome.json              # Biome 配置
├── tsconfig.json           # TypeScript 配置
├── package.json
├── SPEC.md                 # 业务规则文档
└── README.md
```

## 功能

### 脚本代理

Worker 将路径映射到 GitHub Raw URL，流式转发内容：

| 路径 | 说明 |
|------|------|
| `/check.py` | VPS 流媒体解锁检测 |

### 首页

访问 `https://s.qadmlee.com/` 返回 HTML 页面，列出所有可用脚本及使用方式。

### 新增脚本

编辑 `src/index.ts` 中的 `ROUTES` 对象，然后部署：

```diff
 const ROUTES: Readonly<Record<string, ScriptEntry>> = {
   "/check.py": {
     url: "https://raw.githubusercontent.com/leeing/vpscheck/refs/heads/main/check.py",
     description: "VPS 流媒体解锁检测",
   },
+  "/realm.py": {
+    url: "https://raw.githubusercontent.com/leeing/realm/main/realm.py",
+    description: "Realm 端口转发管理",
+  },
 };
```

## 部署

### 1. 安装依赖

```bash
pnpm install
```

### 2. 添加 DNS 记录

Cloudflare Dashboard → `qadmlee.com` → DNS → 添加记录：

| 类型 | 名称 | 内容 | 代理状态 |
|------|------|------|----------|
| `AAAA` | `s` | `100::` | ✅ 已代理 |

> `100::` 是占位地址，实际流量由 Worker 拦截处理。

### 3. 部署

```bash
pnpm run deploy
```

### 4. 验证

```bash
curl -sL https://s.qadmlee.com/           # 首页
curl -sL https://s.qadmlee.com/check.py | head -5  # 脚本内容
curl -sI https://s.qadmlee.com/nonexistent         # 404
```

## 开发

```bash
pnpm dev          # 本地开发（Miniflare）
pnpm check        # Biome lint + format
pnpm typecheck    # TypeScript 类型检查
pnpm test         # 运行测试
```
