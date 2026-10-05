// Proxy către Overpass (OpenStreetMap): cererea pleacă de pe server, deci nu o blochează browserul, extensiile sau CORS.
const EP = ["https://overpass-api.de/api/interpreter", "https://overpass.kumi.systems/api/interpreter", "https://maps.mail.ru/osm/tools/overpass/api/interpreter"];
exports.handler = async (event) => {
  if (event.httpMethod !== "POST") return { statusCode: 405, body: "{}" };
  let q; try { q = String(JSON.parse(event.body || "{}").q || ""); } catch (e) { return { statusCode: 400, body: "{}" }; }
  if (!q.startsWith("[out:json]") || q.length > 20000) return { statusCode: 400, body: "{}" };
  for (const u of EP) {
    const ctl = new AbortController(); const t = setTimeout(() => ctl.abort(), 9000);
    try {
      const r = await fetch(u, { method: "POST", body: "data=" + encodeURIComponent(q), headers: { "content-type": "application/x-www-form-urlencoded", "user-agent": "PresentFinder/1.0" }, signal: ctl.signal });
      if (r.ok) return { statusCode: 200, headers: { "content-type": "application/json", "cache-control": "public, max-age=600" }, body: await r.text() };
    } catch (e) { /* încercăm următorul server */ } finally { clearTimeout(t); }
  }
  return { statusCode: 502, body: "{}" };
};
