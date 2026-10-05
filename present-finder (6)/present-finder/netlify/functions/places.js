// Nota și numărul de recenzii de la Google Places (opțional).
// Merge doar dacă în Netlify există variabila GOOGLE_PLACES_API_KEY. Altfel răspunde 501 și aplicația nu mai încearcă.
exports.handler = async (event) => {
  const key = process.env.GOOGLE_PLACES_API_KEY;
  if (!key) return { statusCode: 501, body: "{}" };
  const p = event.queryStringParameters || {};
  const name = String(p.n || "").slice(0, 120), lat = parseFloat(p.lat), lng = parseFloat(p.lng);
  if (!name || !isFinite(lat) || !isFinite(lng)) return { statusCode: 400, body: "{}" };
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), 6000);
  try {
    const r = await fetch("https://places.googleapis.com/v1/places:searchText", {
      method: "POST", signal: ctl.signal,
      headers: { "content-type": "application/json", "X-Goog-Api-Key": key, "X-Goog-FieldMask": "places.rating,places.userRatingCount,places.priceLevel" },
      body: JSON.stringify({ textQuery: name, maxResultCount: 1, locationBias: { circle: { center: { latitude: lat, longitude: lng }, radius: 300 } } }),
    });
    if (!r.ok) return { statusCode: 502, body: "{}" };
    const x = ((await r.json()).places || [])[0] || {};
    return {
      statusCode: 200,
      headers: { "content-type": "application/json", "cache-control": "public, max-age=86400" },
      body: JSON.stringify({ rating: x.rating, n: x.userRatingCount, price: x.priceLevel }),
    };
  } catch (e) {
    return { statusCode: 502, body: "{}" };
  } finally { clearTimeout(t); }
};
