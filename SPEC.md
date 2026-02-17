# cf-scripts 业务规则

## 概述

通过 Cloudflare Worker 反向代理 GitHub 上的脚本文件，支持 `curl | python3` 一键执行。

## 路由规则

| 路径 | 上游 URL | 说明 |
|------|----------|------|
| `/` | — | HTML 首页，列出所有可用脚本 |
| `/check.py` | `https://raw.githubusercontent.com/leeing/vpscheck/refs/heads/main/check.py` | VPS 流媒体解锁检测 |

### 新增脚本

在 `src/index.ts` 的 `ROUTES` 对象中添加一行即可。

## 响应规则

| 场景 | Status | Content-Type | Cache-Control |
|------|--------|-------------|---------------|
| 首页 | 200 | `text/html; charset=utf-8` | `public, max-age=3600` |
| 脚本代理 | 200 | `text/plain; charset=utf-8` | `no-cache` |
| 路径不存在 | 404 | `text/plain; charset=utf-8` | — |
| 上游不可达 | 502 | `text/plain; charset=utf-8` | — |
| 上游非 200 | 502 | `text/plain; charset=utf-8` | — |

## 安全规则

- 不缓存脚本内容（`no-cache`），确保每次拉取最新版本
- 流式转发上游响应，不在 Worker 内缓冲完整响应体
- User-Agent 标识为 `cf-worker`
