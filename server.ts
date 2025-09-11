import http from 'http';
import { URL } from 'url';
import fetch from 'node-fetch';

const YANDEX_CLIENT_ID = '34f0e66bbf3c4698881003cf8b09f046'
const YANDEX_CLIENT_SECRET = '3cdd89a62dda46a290b307b136efa583'
const REDIRECT_URI = 'https://oauth.yandex.ru/verification_code';
const PORT = 5000;

let accessToken = null; // store in memory for demo

async function exchangeCodeForToken(code) {
  const res = await fetch("https://oauth.yandex.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      client_id: YANDEX_CLIENT_ID,
      client_secret: YANDEX_CLIENT_SECRET,
      redirect_uri: "https://oauth.yandex.ru/verification_code",
    }),
  });

  if (!res.ok) throw new Error("Token exchange failed: " + (await res.text()));
  return res.json();
}

async function getMenu() {
  if (!accessToken) throw new Error("Not logged in");
  const res = await fetch(
    "https://api.partner.market.yandex.ru/v2/categories/tree",
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );
  if (!res.ok) throw new Error("Menu fetch failed: " + (await res.text()));
  return res.json();
}

const server = http.createServer(async (req, res) => {
  // Enable CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  const url = new URL(req.url, `http://${req.headers.host}`);

  if (url.pathname === "/auth/exchange" && req.method === "POST") {
    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", async () => {
      try {
        const { code } = JSON.parse(body);
        const tokens = await exchangeCodeForToken(code);
        accessToken = tokens.access_token; // store
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify(tokens));
      } catch (err) {
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: err.message }));
      }
    });
    return;
  }

  if (url.pathname === "/api/menu" && req.method === "GET") {
    try {
      const menu = await getMenu();
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(menu));
    } catch (err) {
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: err.message }));
    }
    return;
  }

  res.writeHead(404);
  res.end("Not Found");
});

server.listen(5000, () =>
  console.log("Server running at http://localhost:5000")
);
