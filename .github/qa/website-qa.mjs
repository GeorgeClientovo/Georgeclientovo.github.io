import { chromium } from "playwright";
import AxeBuilder from "@axe-core/playwright";
import fs from "node:fs/promises";

const base = "http://127.0.0.1:4173";
const pages = [
  ["home", "/index.html"],
  ["process", "/how-it-works.html"],
  ["contact", "/contact.html"],
  ["privacy", "/privacy-and-security.html"],
  ["checklist", "/client-onboarding-checklist.html"],
  ["forms-managed", "/client-onboarding-forms-vs-managed-service.html"],
  ["not-found", "/404.html"]
];
const viewports = [
  { name: "mobile", width: 375, height: 900 },
  { name: "desktop", width: 1440, height: 1100 }
];
await fs.mkdir("qa-artifacts/screenshots", { recursive: true });
const browser = await chromium.launch({ headless: true });
const serious = [];
const broken = [];
try {
  for (const viewport of viewports) {
    const context = await browser.newContext({ viewport });
    const page = await context.newPage();
    for (const [name, path] of pages) {
      await page.goto(base + path, { waitUntil: "networkidle" });
      await page.screenshot({ path: `qa-artifacts/screenshots/${name}-${viewport.name}.png`, fullPage: true });
      const results = await new AxeBuilder({ page }).analyze();
      const failures = results.violations.filter(v => v.impact === "critical" || v.impact === "serious");
      if (failures.length) serious.push({ name, viewport: viewport.name, failures: failures.map(v => ({ id: v.id, impact: v.impact, nodes: v.nodes.length })) });
      const hrefs = await page.locator("a[href]").evaluateAll(as => [...new Set(as.map(a => a.getAttribute("href")))]);
      for (const href of hrefs) {
        if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("https://app.clientovo.com")) continue;
        const url = new URL(href, base + path);
        if (url.origin !== base) continue;
        const response = await page.request.get(url.origin + url.pathname);
        if (response.status() >= 400) broken.push({ page: path, href, status: response.status() });
      }
    }
    await context.close();
  }

  const mobile = await browser.newContext({ viewport: { width: 375, height: 900 } });
  const mobilePage = await mobile.newPage();
  await mobilePage.goto(base + "/index.html");
  await mobilePage.locator("[data-menu-button]").click();
  if (await mobilePage.locator("[data-menu-button]").getAttribute("aria-expanded") !== "true") throw new Error("Mobile menu did not open");
  await mobilePage.keyboard.press("Escape");
  if (await mobilePage.locator("[data-menu-button]").getAttribute("aria-expanded") !== "false") throw new Error("Mobile menu did not close with Escape");
  await mobile.close();

  const formContext = await browser.newContext({ viewport: { width: 1440, height: 1100 } });
  const formPage = await formContext.newPage();
  await formPage.goto(base + "/index.html#setup-call");
  await formPage.fill("#setup-name", "Clientovo website QA");
  await formPage.fill("#setup-email", "qa@example.com");
  await formPage.fill("#setup-agency", "Clientovo QA");
  await formPage.fill("#setup-website", "https://example.com");
  await formPage.fill("#setup-clients", "1");
  await formPage.locator("[data-setup-form] button[type=submit]").click();
  await formPage.locator("[data-form-success]").waitFor({ state: "visible", timeout: 20000 });
  await formContext.close();
} finally {
  await browser.close();
}
console.log(JSON.stringify({ serious, broken }, null, 2));
if (serious.length || broken.length) process.exit(1);
