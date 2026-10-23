import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const origin = "https://avivajpeyi.github.io";
const events = {};
const stored = new Map();
let online;
const context = {
  URL, Response,
  self: { location: { origin }, addEventListener: (name, callback) => { events[name] = callback; } },
  caches: {
    match: async request => stored.get(request.url)?.clone(),
    open: async () => ({ put: async (request, response) => { stored.set(request.url, response); } }),
  },
  fetch: async () => { if (online instanceof Error) throw online; return online.clone(); },
};
vm.runInNewContext(readFileSync(new URL("../web/public/sw.js", import.meta.url), "utf8"), context);
async function fetchCached(path, response) {
  online = response;
  let result;
  events.fetch({ request: { url: origin + path, method: "GET" }, respondWith: promise => { result = promise; } });
  return await result;
}
const path = "/fitnotes/catalog/manifest.json";
assert.equal(await (await fetchCached(path, new Response("valid catalog"))).text(), "valid catalog");
assert.equal(await (await fetchCached(path, new Response("server down", { status: 503 }))).text(), "valid catalog");
assert.equal(await (await fetchCached(path, new Error("offline"))).text(), "valid catalog");
assert.equal((await fetchCached("/fitnotes/catalog/missing.json", new Response("missing", { status: 404 }))).status, 404);
assert.equal((await fetchCached("/fitnotes/catalog/missing.json", new Error("offline"))).type, "error");
assert.equal(stored.size, 1);
for (const request of [{ url: origin + path, method: "POST" }, { url: "https://other.example/catalog/manifest.json", method: "GET" }]) {
  events.fetch({ request, respondWith: () => { assert.fail("Must not intercept unrelated requests"); } });
}
console.log("Service worker: public GET cache, offline/HTTP fallback and request isolation passed.");
