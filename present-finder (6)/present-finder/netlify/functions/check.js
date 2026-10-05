// Verifică dacă o pagină de căutare dintr-un magazin se încarcă și are rezultate.
// Răspuns: {s:"ok"|"empty"|"dead"|"unknown"}. "unknown" = site-ul ne-a blocat (nu ascundem linkul).
const HOSTS = /(^|\.)(emag\.ro|altex\.ro|flanco\.ro|pcgarage\.ro|elefant\.ro|decathlon\.ro|carturesti\.ro|olx\.ro|vinted\.ro)$/;
const EMPTY = /nu am g[ăa]sit|nu am gasit|0 rezultate|nu exist[ăa] rezultate|niciun rezultat|nicio ofert[ăa]|no results/i;
const json = (s, extra = {}) => ({
  statusCode: 200,
  headers: { "content-type": "application/json", "cache-control": "public, max-age=1800" },
  body: JSON.stringify({ s, ...extra }),
});

exports.handler = async (event) => {
  let u;
  try { u = new URL(event.queryStringParameters && event.queryStringParameters.u); } catch (e) { return { statusCode: 400, body: "{}" }; }
  if (u.protocol !== "https:" || !HOSTS.test(u.hostname)) return { statusCode: 400, body: "{}" }; // doar magazinele din listă
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), 7000);
  try {
    const r = await fetch(u.href, {
      redirect: "follow", signal: ctl.signal,
      headers: { "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124 Safari/537.36", "accept-language": "ro-RO,ro;q=0.9" },
    });
    if (r.status === 404 || r.status === 410) return json("dead");
    if (r.status >= 400) return json("unknown");
    let body = (await r.text()).slice(0, 600000);
    if (body.length < 20000 && /captcha|access denied|are you a human|just a moment/i.test(body)) return json("unknown");
    body = body.replace(/<script[\s\S]*?<\/script>/gi, ""); // textele din scripturi dau alarme false
    if (EMPTY.test(body)) return json("empty");
    // eMAG: "N rezultate pentru: "text"" trebuie să conțină produsul căutat (altfel filtrul a ajuns în textul căutării)
    if (/emag\.ro$/.test(u.hostname) && /\/search\//.test(u.pathname)) {
      const nz = (x) => x.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      const q = nz(decodeURIComponent(u.pathname.split("/search/")[1].split("/")[0]).replace(/[-+]/g, " "));
      const m = body.replace(/<[^>]+>/g, " ").match(/rezultate pentru:?\s*["“„]\s*([^"”“]{1,80})/i);
      if (m && q.length > 3 && !nz(m[1]).includes(q.slice(0, 4))) return json("empty");
    }
    return json("ok");
  } catch (e) {
    return json("unknown");
  } finally { clearTimeout(t); }
};
