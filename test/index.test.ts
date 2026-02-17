import { SELF } from "cloudflare:test";
import { describe, expect, it } from "vitest";

describe("cf-scripts Worker", () => {
	describe("GET /", () => {
		it("returns HTML homepage with script listing", async () => {
			const response = await SELF.fetch("https://s.qadmlee.com/");
			expect(response.status).toBe(200);

			const contentType = response.headers.get("content-type");
			expect(contentType).toContain("text/html");

			const body = await response.text();
			expect(body).toContain("cf-scripts");
			expect(body).toContain("/check.py");
			expect(body).toContain("VPS");
		});

		it("sets cache-control for homepage", async () => {
			const response = await SELF.fetch("https://s.qadmlee.com/");
			const cacheControl = response.headers.get("cache-control");
			expect(cacheControl).toContain("max-age=3600");
		});
	});

	describe("GET /check.py", () => {
		it("returns script content with correct headers", async () => {
			const response = await SELF.fetch("https://s.qadmlee.com/check.py");
			expect(response.status).toBe(200);

			const contentType = response.headers.get("content-type");
			expect(contentType).toContain("text/plain");

			const cacheControl = response.headers.get("cache-control");
			expect(cacheControl).toBe("no-cache");

			const body = await response.text();
			expect(body.length).toBeGreaterThan(0);
		});
	});

	describe("GET /nonexistent", () => {
		it("returns 404 for unknown paths", async () => {
			const response = await SELF.fetch("https://s.qadmlee.com/nonexistent");
			expect(response.status).toBe(404);

			const body = await response.text();
			expect(body).toContain("404");
		});
	});
});
