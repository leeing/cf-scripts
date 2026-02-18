/**
 * Cloudflare Worker — 脚本分发服务
 *
 * 通过自定义域名反向代理 GitHub 上的脚本文件，
 * 支持 `curl -sL https://s.qadmlee.com/check.py | python3` 一键运行。
 */

interface ScriptEntry {
	readonly url: string;
}

/**
 * 路由表 — 新增脚本只需加一行
 */
const ROUTES: Readonly<Record<string, ScriptEntry>> = {
	"/check.py": {
		url: "https://raw.githubusercontent.com/leeing/vpscheck/refs/heads/main/check.py",
	},
	"/deploy.py": {
		url: "https://raw.githubusercontent.com/leeing/nano-xray/refs/heads/main/deploy.py",
	},
} as const;

const DOMAIN = "s.qadmlee.com";

/**
 * 生成首页 HTML — 列出所有可用脚本
 */
function renderHomePage(): string {
	const scriptCards = Object.entries(ROUTES)
		.map(
			([path, _entry], i) => `
      <div class="card" style="animation-delay:${String(0.1 + i * 0.12)}s">
        <div class="card-header">
          <div class="dots"><span></span><span></span><span></span></div>
          <span class="card-title">${path}</span>
        </div>
        <div class="cmd-row" onclick="copyCmd(this)" title="点击复制">
          <span class="prompt">$</span>
          <code>curl -sLO https://${DOMAIN}${path}</code>
          <svg class="copy-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
        </div>
      </div>`,
		)
		.join("");

	return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Scripts</title>
  <meta name="description" content="通过 Cloudflare Worker 一键运行远程脚本">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg: #0a0a0f;
      --surface: rgba(255,255,255,0.03);
      --border: rgba(255,255,255,0.06);
      --text: #c8ccd4;
      --text-dim: #5a5f6b;
      --accent: #00e5a0;
      --accent-dim: rgba(0,229,160,0.08);
      --glow: rgba(0,229,160,0.15);
      --amber: #f0b232;
      --red: #f05a5a;
      --mono: 'JetBrains Mono', 'Fira Code', monospace;
      --sans: 'DM Sans', system-ui, sans-serif;
    }
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    html { scroll-behavior: smooth; }
    body {
      font-family: var(--sans);
      background: var(--bg);
      color: var(--text);
      min-height: 100vh;
      overflow-x: hidden;
      position: relative;
    }
    /* grain texture overlay */
    body::before {
      content: '';
      position: fixed; inset: 0;
      background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.03'/%3E%3C/svg%3E");
      pointer-events: none;
      z-index: 9999;
    }
    /* ambient glow orbs */
    .glow-1, .glow-2 {
      position: fixed;
      border-radius: 50%;
      filter: blur(120px);
      pointer-events: none;
      z-index: 0;
    }
    .glow-1 {
      width: 500px; height: 500px;
      background: radial-gradient(circle, var(--glow) 0%, transparent 70%);
      top: -150px; right: -100px;
      animation: drift-1 20s ease-in-out infinite;
    }
    .glow-2 {
      width: 400px; height: 400px;
      background: radial-gradient(circle, rgba(99,102,241,0.1) 0%, transparent 70%);
      bottom: -100px; left: -80px;
      animation: drift-2 25s ease-in-out infinite;
    }
    @keyframes drift-1 {
      0%,100% { transform: translate(0,0); }
      50% { transform: translate(-60px, 80px); }
    }
    @keyframes drift-2 {
      0%,100% { transform: translate(0,0); }
      50% { transform: translate(50px, -60px); }
    }
    .wrapper {
      position: relative;
      z-index: 1;
      max-width: 640px;
      margin: 0 auto;
      padding: 6rem 1.5rem 4rem;
    }
    /* header area */
    .logo {
      display: inline-flex;
      align-items: center;
      gap: 0.6rem;
      margin-bottom: 0.75rem;
      animation: fade-up 0.6s ease both;
    }
    .logo-icon {
      width: 36px; height: 36px;
      background: linear-gradient(135deg, var(--accent), #34d399);
      border-radius: 8px;
      display: flex; align-items: center; justify-content: center;
      font-family: var(--mono);
      font-weight: 700;
      font-size: 1rem;
      color: var(--bg);
      box-shadow: 0 0 24px var(--glow);
    }
    .logo-text {
      font-family: var(--mono);
      font-size: 1.35rem;
      font-weight: 700;
      color: #e4e7ec;
      letter-spacing: -0.02em;
    }
    .tagline {
      font-size: 0.95rem;
      color: var(--text-dim);
      line-height: 1.6;
      margin-bottom: 3rem;
      animation: fade-up 0.6s ease 0.08s both;
    }
    .tagline strong {
      color: var(--text);
      font-weight: 500;
    }
    /* section label */
    .section-label {
      font-family: var(--mono);
      font-size: 0.7rem;
      text-transform: uppercase;
      letter-spacing: 0.15em;
      color: var(--text-dim);
      margin-bottom: 1rem;
      display: flex; align-items: center; gap: 0.75rem;
      animation: fade-up 0.6s ease 0.05s both;
    }
    .section-label::after {
      content: '';
      flex: 1;
      height: 1px;
      background: var(--border);
    }
    /* script cards */
    .card {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 1.25rem 1.5rem;
      margin-bottom: 1rem;
      transition: border-color 0.3s, box-shadow 0.3s, transform 0.2s;
      animation: fade-up 0.5s ease both;
    }
    .card:hover {
      border-color: rgba(0,229,160,0.2);
      box-shadow: 0 0 40px rgba(0,229,160,0.05), inset 0 1px 0 rgba(255,255,255,0.03);
      transform: translateY(-2px);
    }
    .card-header {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      margin-bottom: 0.6rem;
    }
    .dots {
      display: flex; gap: 5px;
    }
    .dots span {
      width: 8px; height: 8px;
      border-radius: 50%;
    }
    .dots span:nth-child(1) { background: var(--red); }
    .dots span:nth-child(2) { background: var(--amber); }
    .dots span:nth-child(3) { background: var(--accent); }
    .card-title {
      font-family: var(--mono);
      font-size: 0.85rem;
      font-weight: 500;
      color: #e4e7ec;
    }
    .card-desc {
      font-size: 0.85rem;
      color: var(--text-dim);
      margin-bottom: 1rem;
      line-height: 1.5;
    }
    .cmd-row {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      background: rgba(0,0,0,0.3);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 0.6rem 0.75rem;
      cursor: pointer;
      transition: background 0.2s, border-color 0.2s;
      position: relative;
      overflow: hidden;
    }
    .cmd-row:hover {
      background: rgba(0,0,0,0.5);
      border-color: rgba(0,229,160,0.15);
    }
    .cmd-row:active {
      transform: scale(0.995);
    }
    .prompt {
      font-family: var(--mono);
      color: var(--accent);
      font-weight: 500;
      font-size: 0.85rem;
      user-select: none;
    }
    .cmd-row code {
      font-family: var(--mono);
      font-size: 0.78rem;
      color: var(--text);
      flex: 1;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .copy-icon {
      width: 14px; height: 14px;
      color: var(--text-dim);
      flex-shrink: 0;
      transition: color 0.2s;
    }
    .cmd-row:hover .copy-icon { color: var(--accent); }
    /* toast */
    .toast {
      position: fixed;
      bottom: 2rem;
      left: 50%;
      transform: translateX(-50%) translateY(20px);
      background: var(--accent);
      color: var(--bg);
      font-family: var(--mono);
      font-size: 0.78rem;
      font-weight: 500;
      padding: 0.5rem 1.25rem;
      border-radius: 100px;
      opacity: 0;
      pointer-events: none;
      transition: opacity 0.3s, transform 0.3s;
      z-index: 100;
    }
    .toast.show {
      opacity: 1;
      transform: translateX(-50%) translateY(0);
    }
    /* how-to section */
    .how-to {
      margin-top: 2.5rem;
      animation: fade-up 0.5s ease 0.25s both;
    }
    .step {
      display: flex;
      gap: 1rem;
      margin-bottom: 1.25rem;
      align-items: flex-start;
    }
    .step-num {
      font-family: var(--mono);
      font-size: 0.7rem;
      font-weight: 500;
      color: var(--accent);
      background: var(--accent-dim);
      width: 24px; height: 24px;
      border-radius: 6px;
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0;
      margin-top: 2px;
    }
    .step-text {
      font-size: 0.85rem;
      color: var(--text-dim);
      line-height: 1.5;
    }
    .step-text code {
      font-family: var(--mono);
      font-size: 0.78rem;
      color: var(--text);
      background: rgba(255,255,255,0.04);
      padding: 0.15em 0.4em;
      border-radius: 4px;
    }
    /* footer */
    .footer {
      margin-top: 4rem;
      padding-top: 1.5rem;
      border-top: 1px solid var(--border);
      display: flex;
      justify-content: center;
      align-items: center;
      font-size: 0.75rem;
      color: var(--text-dim);
      animation: fade-up 0.5s ease 0.35s both;
    }
    .footer a {
      color: var(--text-dim);
      text-decoration: none;
      transition: color 0.2s;
    }
    .footer a:hover { color: var(--accent); }

    @keyframes fade-up {
      from { opacity: 0; transform: translateY(16px); }
      to { opacity: 1; transform: translateY(0); }
    }
    @media (max-width: 480px) {
      .wrapper { padding: 4rem 1rem 3rem; }
      .cmd-row code { font-size: 0.7rem; }
    }
  </style>
</head>
<body>
  <div class="glow-1"></div>
  <div class="glow-2"></div>
  <div class="wrapper">
    <div class="logo">
      <div class="logo-icon">./</div>
      <span class="logo-text">Scripts</span>
    </div>



    ${scriptCards}



    <div class="footer">
      <span>Powered by <a href="https://s.qadmlee.com" target="_blank" rel="noopener">leeing</a></span>
    </div>
  </div>
  <div class="toast" id="toast">已复制到剪贴板</div>
  <script>
    function copyCmd(el) {
      const code = el.querySelector('code');
      if (!code) return;
      navigator.clipboard.writeText(code.textContent || '').then(function() {
        const t = document.getElementById('toast');
        if (!t) return;
        t.classList.add('show');
        setTimeout(function() { t.classList.remove('show'); }, 1800);
      });
    }
  </script>
</body>
</html>`;
}

export default {
	async fetch(request: Request): Promise<Response> {
		const { pathname } = new URL(request.url);

		// 首页 — 列出所有可用脚本
		if (pathname === "/" || pathname === "") {
			return new Response(renderHomePage(), {
				headers: {
					"content-type": "text/html; charset=utf-8",
					"cache-control": "public, max-age=3600",
				},
			});
		}

		// 查找路由
		const entry = ROUTES[pathname];
		if (!entry) {
			return new Response("404 Not Found\n", {
				status: 404,
				headers: { "content-type": "text/plain; charset=utf-8" },
			});
		}

		// 从上游拉取脚本 — 流式转发，不缓冲整个响应
		let upstream: Response;
		try {
			upstream = await fetch(entry.url, {
				headers: { "User-Agent": "cf-worker" },
			});
		} catch {
			return new Response("502 Bad Gateway — upstream unreachable\n", {
				status: 502,
				headers: { "content-type": "text/plain; charset=utf-8" },
			});
		}

		if (!upstream.ok) {
			return new Response(`502 Bad Gateway — upstream returned ${String(upstream.status)}\n`, {
				status: 502,
				headers: { "content-type": "text/plain; charset=utf-8" },
			});
		}

		return new Response(upstream.body, {
			status: 200,
			headers: {
				"content-type": "text/plain; charset=utf-8",
				"cache-control": "no-cache",
			},
		});
	},
};
