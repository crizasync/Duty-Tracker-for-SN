// Dependency-free Chrome DevTools smoke check with isolated browser storage and mocked API data.
import { spawn } from "node:child_process";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import assert from "node:assert/strict";

const profile = await fs.mkdtemp(path.join(os.tmpdir(), "duty-geomap-browser-"));
const chrome = spawn(process.env.CHROME_PATH || "C:/Program Files/Google/Chrome/Application/chrome.exe", ["--headless=new", "--disable-gpu", "--no-first-run", "--no-default-browser-check", "--remote-debugging-port=0", `--user-data-dir=${profile}`, "about:blank"], { windowsHide: true, stdio: "ignore" });
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
let socket;
let sequence = 0;
const pending = new Map();
const exceptions = [];
const logs = [
  { id: 1, hospital: "Test Hospital", ward: "ER", shift: "Morning", duty_date: "2026-11-04", time_in: "06:00", time_out: "14:00", total_hours: "8", facility_latitude: 14.6, facility_longitude: 121, facility_place_id: "W:100", facility_address: "Test City" },
  { id: 2, hospital: "Test Hospital", ward: "ER", shift: "Morning", duty_date: "2026-11-03", time_in: "06:00", time_out: "10:00", total_hours: "4", facility_latitude: 14.6, facility_longitude: 121, facility_place_id: "W:100" },
  { id: 3, hospital: "Unmapped Hospital", ward: "ER", shift: "Morning", duty_date: "2026-11-02", time_in: "06:00", time_out: "10:00", total_hours: "4" },
];
function command(method, params = {}) {
  const id = ++sequence;
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => { pending.delete(id); reject(new Error(`CDP timed out: ${method}`)); }, 15000);
    pending.set(id, { resolve, reject, timer });
    socket.send(JSON.stringify({ id, method, params }));
  });
}
async function evaluate(expression) {
  const result = await command("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true });
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.text + ": " + result.exceptionDetails.exception?.description);
  return result.result.value;
}
async function waitFor(expression, label) {
  for (let tries = 0; tries < 80; tries++) { if (await evaluate(expression)) return; await sleep(100); }
  throw new Error(`Timed out waiting for ${label}`);
}
async function intercept(event) {
  if (!event.request.url.includes("/api/")) return command("Fetch.failRequest", { requestId: event.requestId, errorReason: "BlockedByClient" });
  let body = {};
  if (event.request.method !== "OPTIONS") {
    if (event.request.url.includes("/facilities/search")) body = { facilities: [{ name: "Selected Test Hospital", latitude: 14.62, longitude: 121.02, address: "Test City", placeId: "W:200" }] };
    else if (event.request.method === "POST") {
      const data = JSON.parse(event.request.postData);
      const log = { id: 100 + logs.length, client_entry_id: data.clientEntryId, hospital: data.hospital, ward: data.ward, shift: data.shift, duty_date: data.dutyDate, time_in: data.timeIn, time_out: data.timeOut, total_hours: 8, facility_latitude: data.facilityLocation?.latitude, facility_longitude: data.facilityLocation?.longitude, facility_address: data.facilityLocation?.address, facility_place_id: data.facilityLocation?.placeId };
      logs.push(log); body = { dutyLog: log };
    } else body = { dutyLogs: logs };
  }
  return command("Fetch.fulfillRequest", { requestId: event.requestId, responseCode: 200, responseHeaders: [{ name: "Content-Type", value: "application/json" }, { name: "Access-Control-Allow-Origin", value: "*" }, { name: "Access-Control-Allow-Headers", value: "authorization,content-type" }, { name: "Access-Control-Allow-Methods", value: "GET,POST,PUT,DELETE,OPTIONS" }], body: Buffer.from(JSON.stringify(body)).toString("base64") });
}
try {
  let port;
  for (let tries = 0; tries < 100; tries++) {
    try { port = (await fs.readFile(path.join(profile, "DevToolsActivePort"), "utf8")).split("\n")[0]; break; } catch { await sleep(100); }
  }
  if (!port) throw new Error("Chrome did not start");
  const pages = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
  socket = new WebSocket(pages.find((page) => page.type === "page").webSocketDebuggerUrl);
  await new Promise((resolve, reject) => { socket.addEventListener("open", resolve, { once: true }); socket.addEventListener("error", reject, { once: true }); });
  socket.addEventListener("message", (event) => {
    const message = JSON.parse(event.data);
    if (message.id) { const entry = pending.get(message.id); if (!entry) return; clearTimeout(entry.timer); pending.delete(message.id); if (message.error) entry.reject(new Error(message.error.message)); else entry.resolve(message.result); }
    else if (message.method === "Fetch.requestPaused") intercept(message.params).catch((error) => exceptions.push(error.message));
    else if (message.method === "Runtime.exceptionThrown") exceptions.push(message.params.exceptionDetails.exception?.description || message.params.exceptionDetails.text);
  });
  await command("Runtime.enable");
  await command("Page.enable");
  await command("Network.enable");
  await command("Fetch.enable", { patterns: [{ urlPattern: "*://localhost:5000/api/*" }, { urlPattern: "*://tile.openstreetmap.org/*" }, { urlPattern: "*://fonts.googleapis.com/*" }, { urlPattern: "*://fonts.gstatic.com/*" }] });
  await command("Page.addScriptToEvaluateOnNewDocument", { source: 'localStorage.setItem("user",JSON.stringify({id:"geomap-browser-test",full_name:"Test Student"}));localStorage.setItem("token","test-token");' });
  await command("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
  await command("Page.navigate", { url: "http://127.0.0.1:5178/geomap" });
  await waitFor('document.querySelectorAll(".leaflet-marker-icon").length===1', "facility marker");
  assert.equal(await evaluate('document.querySelectorAll(".geo-related-logs article").length'), 2);
  assert.match(await evaluate('document.querySelector(".geo-total").textContent'), /12\.00/);
  await evaluate('document.querySelector(".leaflet-marker-icon").click()');
  await waitFor('!!document.querySelector(".leaflet-popup-content")', "marker popup");
  assert.match(await evaluate('document.querySelector(".leaflet-popup-content").textContent'), /Test Hospital/);
  for (const width of [320, 390, 1280]) {
    await command("Emulation.setDeviceMetricsOverride", { width, height: 844, deviceScaleFactor: 1, mobile: width < 1024 });
    await sleep(150);
    const size = await evaluate('({scroll:document.documentElement.scrollWidth,client:document.documentElement.clientWidth})');
    assert.ok(size.scroll <= size.client, `Horizontal overflow at ${width}px: ${JSON.stringify(size)}`);
    if (width < 1024) {
      const header = await evaluate('(()=>{const h=document.querySelector(".geomap-page .page-heading"),c=h.querySelector(".page-heading-copy").getBoundingClientRect(),i=h.querySelector(".heading-cat").getBoundingClientRect(),a=h.querySelector(".page-heading-actions").getBoundingClientRect(),b=h.getBoundingClientRect();return {separate:c.right<=i.left,actionBelow:a.top>=Math.max(c.bottom,i.bottom),fits:a.bottom<=b.bottom+1};})()');
      assert.ok(header.separate && header.actionBelow && header.fits, `GeoMap header overlap at ${width}px: ${JSON.stringify(header)}`);
    }
  }
  await command("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
  await evaluate('document.querySelector(".page-heading-badge").click()');
  await waitFor('[...document.querySelectorAll("button")].some(b=>b.textContent.includes("Add Duty Log"))', "duty page");
  await evaluate('[...document.querySelectorAll("button")].find(b=>b.textContent.includes("Add Duty Log")).click()');
  await waitFor('!!document.querySelector(".cute-modal .facility-picker")', "optional picker");
  await evaluate('document.querySelector(".facility-picker summary").click()');
  await evaluate('(()=>{const i=document.querySelector(".facility-picker input");Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,"value").set.call(i,"Hospital Test City");i.dispatchEvent(new Event("input",{bubbles:true}));})()');
  await evaluate('document.querySelector(".facility-search-row button").click()');
  await waitFor('!!document.querySelector(".facility-results button")', "facility search results");
  await evaluate('document.querySelector(".facility-results button").click()');
  await waitFor('!!document.querySelector(".facility-selected")', "selected location");
  assert.equal(await evaluate('document.querySelector(".cute-modal input[placeholder=Hospital]").value'), "Selected Test Hospital");
  await evaluate('(()=>{const fields=[["input[type=date]","2026-11-04"],["input[placeholder=Ward]","ER"],["input[type=time]","22:00"]];for(const [s,v]of fields){const i=document.querySelector(".cute-modal "+s);Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,"value").set.call(i,v);i.dispatchEvent(new Event("input",{bubbles:true}));}const i=document.querySelectorAll(".cute-modal input[type=time]")[1];Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,"value").set.call(i,"06:00");i.dispatchEvent(new Event("input",{bubbles:true}));})()');
  await command("Network.emulateNetworkConditions", { offline: true, latency: 0, downloadThroughput: 0, uploadThroughput: 0 });
  await evaluate('document.querySelector(".cute-modal form").requestSubmit()');
  await waitFor('!document.querySelector(".cute-modal")', "offline save");
  assert.equal(await evaluate('JSON.parse(localStorage.getItem("duty-tracker:duty-queue:geomap-browser-test")).length'), 1);
  await command("Network.emulateNetworkConditions", { offline: false, latency: 0, downloadThroughput: -1, uploadThroughput: -1 });
  await waitFor('JSON.parse(localStorage.getItem("duty-tracker:duty-queue:geomap-browser-test")).length===0', "automatic reconnect sync");
  assert.equal(logs.length, 4);
  await evaluate('document.querySelector(".mobile-topbar button").click()');
  await evaluate('[...document.querySelectorAll("#workspace-navigation a")].find(a=>a.href.endsWith("/geomap")).click()');
  await waitFor('document.querySelectorAll(".leaflet-marker-icon").length===2', "new facility marker after sync");
  assert.deepEqual(exceptions, []);
  console.log("GeoMap browser check passed: 320/390/1280px layouts, marker popup, facility selection, offline save, reconnect sync, and refreshed pins.");
} finally {
  if (socket?.readyState === WebSocket.OPEN) { await command("Browser.close").catch(() => {}); socket.close(); }
  chrome.kill();
  await sleep(500);
  // Only remove the dedicated temporary browser profile created by this script.
  const resolved = path.resolve(profile);
  if (resolved.startsWith(path.resolve(os.tmpdir()) + path.sep) && path.basename(resolved).startsWith("duty-geomap-browser-")) await fs.rm(resolved, { recursive: true, force: true, maxRetries: 3 }).catch(() => {});
}
