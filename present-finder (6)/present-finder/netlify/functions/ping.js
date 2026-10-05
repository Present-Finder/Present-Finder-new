// Folosit de aplicație ca să afle dacă există conexiune la internet.
exports.handler = async () => ({
  statusCode: 200,
  headers: { "content-type": "application/json", "cache-control": "no-store" },
  body: "{\"ok\":true}",
});
