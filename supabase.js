const SB_URL = "https://orejbsizfqlqvxcnmhbw.supabase.co";
const SB_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9yZWpic2l6ZnFscXZ4Y25taGJ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE3NTA1NTAsImV4cCI6MjEwNzMyNjU1MH0.NdQq5xhDV5McX-5UYC-itXYF95htaEctcUdzY-clbIg";
const H = { apikey: SB_KEY, Authorization: "Bearer " + SB_KEY, "Content-Type": "application/json" };

async function sbGet(table, query = "") {
  const r = await fetch(`${SB_URL}/rest/v1/${table}?${query}`, { headers: H });
  return r.json();
}
async function sbPost(table, body) {
  const r = await fetch(`${SB_URL}/rest/v1/${table}`, { method: "POST", headers: { ...H, Prefer: "return=representation" }, body: JSON.stringify(body) });
  return r.json();
}
async function sbPatch(table, query, body) {
  const r = await fetch(`${SB_URL}/rest/v1/${table}?${query}`, { method: "PATCH", headers: H, body: JSON.stringify(body) });
  return r.json();
}
async function sbDelete(table, query) {
  await fetch(`${SB_URL}/rest/v1/${table}?${query}`, { method: "DELETE", headers: H });
}
async function getState(key, def) {
  const rows = await sbGet("state", `key=eq.${key}`);
  return rows[0] ? rows[0].value : def;
}
async function setState(key, value) {
  const rows = await sbGet("state", `key=eq.${key}`);
  if (rows[0]) await sbPatch("state", `key=eq.${key}`, { value });
  else await sbPost("state", { key, value });
}
