import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);
  return worker.fetch(
    new Request("http://localhost/", { headers: { accept: "text/html" } }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );
}

test("server-renders the travel makeup product", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /景区妆造 · 真实案例/);
  assert.match(html, /REAL TRAVEL PORTRAITS/);
  assert.match(html, /PLAY BEFORE YOU GO/);
  assert.doesNotMatch(html, /codex-preview|Your site is taking shape/);
});

test("keeps the practical planner, smart framing, identities, and studio tools", async () => {
  const page = await readFile(new URL("../app/experience.tsx", import.meta.url), "utf8");
  const gallery = await readFile(new URL("../app/detail-gallery.module.css", import.meta.url), "utf8");
  assert.match(page, /FaceDetector/);
  assert.match(page, /SHOOT PLANNER/);
  assert.match(page, /LIGHT TRACK/);
  assert.match(page, /TRY AN IDENTITY/);
  assert.match(page, /CLOUD DRESS-UP/);
  assert.match(page, /hanfu-stickers\.png/);
  assert.match(page, /localStorage/);
  assert.match(page, /content_snippet/);
  assert.match(page, /style_tags/);
  assert.match(page, /sns-avatar/);
  assert.match(page, /DetailGallery/);
  assert.match(page, /setTimeout\(\(\)=>\{setControlsExpanded\(false\)/);
  assert.match(page, /onPointerMove/);
  assert.match(page, /左右滑动/);
  assert.match(gallery, /controlsCollapsed/);
  assert.match(gallery, /cubic-bezier/);
  assert.match(page, /replace\(\/\^http/);
  assert.doesNotMatch(page, /distance:\s*["'`]\d+\s*m/);
});

test("keeps the honest scenic sandbox, shop clues, and linked visitor work", async () => {
  const sandbox = await readFile(new URL("../app/explore-sandbox.tsx", import.meta.url), "utf8");
  const styles = await readFile(new URL("../app/explore-sandbox.module.css", import.meta.url), "utf8");
  const diorama = await readFile(new URL("../app/city-diorama.tsx", import.meta.url), "utf8");
  const dioramaStyles = await readFile(new URL("../app/city-diorama.module.css", import.meta.url), "utf8");
  assert.match(sandbox, /青绿场景沙盘/);
  assert.match(sandbox, /店铺针为关联线索席/);
  assert.match(sandbox, /不代表真实距离、方位或路线/);
  assert.match(sandbox, /isUsableShopName/);
  assert.match(sandbox, /喜欢的那家\|美食城里面/);
  assert.match(sandbox, /真实关联案例/);
  assert.match(sandbox, /openCase\(preview\.caseId\)/);
  assert.match(sandbox, /地址待采集/);
  assert.doesNotMatch(sandbox, /\d+\s*米/);
  assert.match(styles, /perspective/);
  assert.match(styles, /rotateX/);
  assert.match(diorama, /艺术沙盘 · 非导航地图/);
  assert.match(diorama, /跟随本地时刻/);
  assert.match(diorama, /大唐不夜城/);
  assert.match(diorama, /洛邑古城/);
  assert.match(diorama, /中国朝鲜族民俗园/);
  assert.match(diorama, /西湖/);
  assert.match(dioramaStyles, /\.night \.stars/);
  assert.match(dioramaStyles, /translateZ/);
});

test("keeps the two-purpose glass launcher and an honest mature booking demo", async () => {
  const launcher = await readFile(new URL("../app/quick-create-menu.tsx", import.meta.url), "utf8");
  const launcherStyles = await readFile(new URL("../app/quick-create-menu.module.css", import.meta.url), "utf8");
  const demo = await readFile(new URL("../app/explore-booking-demo.tsx", import.meta.url), "utf8");
  assert.match(launcher, /发布旅拍/);
  assert.match(launcher, /测脸找妆造/);
  assert.match(launcherStyles, /backdrop-filter:blur\(28px\)/);
  assert.match(launcherStyles, /corner-shape:squircle/);
  assert.match(demo, /预约流程演示 · 非真实商家/);
  assert.match(demo, /未来 90 天/);
  assert.match(demo, /不会向任何店铺发送信息/);
  assert.match(demo, /localStorage/);
  assert.match(demo, /全包流程演示/);
  assert.match(demo, /妆造流程演示/);
  assert.match(demo, /摄影流程演示/);
  assert.match(demo, /BookingTicket/);
});

test("keeps the standardized booking flow honest and modular", async () => {
  const booking = await readFile(new URL("../app/booking.tsx", import.meta.url), "utf8");
  const styles = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");
  assert.match(booking, /等待商家确认/);
  assert.match(booking, /提交预约需求/);
  assert.match(booking, /妆造与摄影分别预约/);
  assert.match(booking, /services\.makeup/);
  assert.match(booking, /services\.photo/);
  assert.match(booking, /futureDate\(1\)/);
  assert.match(booking, /futureDate\(92\)/);
  assert.match(booking, /providerConnected/);
  assert.match(booking, /商家尚未接入/);
  assert.match(booking, /暂时不能预约/);
  assert.match(styles, /object-fit:contain!important/);
  assert.match(styles, /完整造型优先/);
  assert.match(styles, /detail-ambient/);
  assert.match(styles, /backdrop-filter:blur\(20px\)/);
  assert.match(booking, /BookingTicket/);
});

test("shows every case for the selected home city and completes booking with a keepable ticket", async () => {
  const page = await readFile(new URL("../app/experience.tsx", import.meta.url), "utf8");
  const ticket = await readFile(new URL("../app/booking-ticket.tsx", import.meta.url), "utf8");
  const ticketStyles = await readFile(new URL("../app/booking-ticket.module.css", import.meta.url), "utf8");
  assert.match(page, /const homeCases=allCases\.filter/);
  assert.match(page, /默认|西安真实旅拍灵感|\{city\}真实旅拍灵感/);
  assert.doesNotMatch(page, /slice\(0,4\)\)\.slice\(0,8\)/);
  assert.match(page, /selectHomeCity/);
  assert.match(page, /app-loader/);
  assert.match(page, /plusOpen\?"关闭":"创作"/);
  assert.match(ticket, /保存小票图片/);
  assert.match(ticket, /收进票夹/);
  assert.match(ticket, /shareNavigator\.share/);
  assert.match(ticketStyles, /perspective:1200px/);
  assert.match(ticketStyles, /@keyframes file-ticket/);
});

test("keeps the evidence, execution, and comparison loop without a floating verifier", async () => {
  const decision = await readFile(new URL("../app/decision.tsx", import.meta.url), "utf8");
  const page = await readFile(new URL("../app/experience.tsx", import.meta.url), "utf8");
  assert.doesNotMatch(decision, /一键验帖|verify-fab|decision-dock/);
  assert.match(page, /查看价格、缺失项和询价话术/);
  assert.match(page, /更多真实妆造可能/);
  assert.match(decision, /每条信息从哪里来/);
  assert.match(decision, /一键询价话术/);
  assert.match(decision, /同地点 \/ 同预算替代/);
  assert.match(decision, /把喜欢的放在一起比/);
  assert.match(decision, /没有可靠坐标，不展示虚构米数/);
});

test("keeps a separate static GitHub Pages build without removing the Sites build", async () => {
  const packageJson = await readFile(new URL("../package.json", import.meta.url), "utf8");
  const pagesEntry = await readFile(new URL("../github-pages/main.tsx", import.meta.url), "utf8");
  const pagesConfig = await readFile(new URL("../vite.github.config.ts", import.meta.url), "utf8");
  const workflow = await readFile(new URL("../.github/workflows/pages.yml", import.meta.url), "utf8");
  assert.match(packageJson, /"build": "vinext build"/);
  assert.match(packageJson, /"build:pages": "vite build --config vite\.github\.config\.ts"/);
  assert.match(pagesEntry, /<Experience \/>/);
  assert.match(pagesEntry, /<DecisionHub cases=\{allCases\} \/>/);
  assert.match(pagesConfig, /GITHUB_REPOSITORY/);
  assert.match(pagesConfig, /dist-pages/);
  assert.match(workflow, /actions\/configure-pages@v5/);
  assert.match(workflow, /actions\/upload-pages-artifact@v4/);
  assert.match(workflow, /actions\/deploy-pages@v4/);
});

test("recovers from expired source-image links without leaving black media panels", async () => {
  const page = await readFile(new URL("../app/experience.tsx", import.meta.url), "utf8");
  const styles = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");
  assert.match(page, /fallbackSrcs=\{item\.images\.slice\(1\)\}/);
  assert.match(page, /lv_retry=/);
  assert.match(page, /loading=\{eager\?"eager":"lazy"\}/);
  assert.match(page, /原帖仍在 · 图片链接待刷新/);
  assert.match(styles, /\.smart-image-fallback/);
});
