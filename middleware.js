/* global process */
import { next } from "@vercel/functions";

const COOKIE_NAME = "zakum_access";
const OWNER_SESSION_SECONDS = 60 * 60 * 24 * 30;
const GUEST_SESSION_SECONDS = 60 * 60 * 24;
const SINGAPORE_UTC_OFFSET_MS = 8 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

const encoder = new TextEncoder();

function toBase64Url(value) {
  const bytes = typeof value === "string" ? encoder.encode(value) : value;
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
}

function fromBase64Url(value) {
  const padded = value.replaceAll("-", "+").replaceAll("_", "/") + "===".slice((value.length + 3) % 4);
  const binary = atob(padded);
  return new Uint8Array([...binary].map((character) => character.charCodeAt(0)));
}

async function digest(value) {
  return new Uint8Array(await crypto.subtle.digest("SHA-256", encoder.encode(value)));
}

async function safeEqual(left, right) {
  const [leftHash, rightHash] = await Promise.all([digest(left), digest(right)]);
  let difference = 0;
  for (let index = 0; index < leftHash.length; index += 1) {
    difference |= leftHash[index] ^ rightHash[index];
  }
  return difference === 0;
}

async function sign(value, secret) {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  return new Uint8Array(await crypto.subtle.sign("HMAC", key, encoder.encode(value)));
}

async function passwordFingerprint(password, secret) {
  const signature = await sign(`password:${password}`, secret);
  return toBase64Url(signature).slice(0, 16);
}

function currentGuestPinPeriod(now = Date.now()) {
  return Math.floor((now + SINGAPORE_UTC_OFFSET_MS) / DAY_MS);
}

async function guestPinForPeriod(period, secret) {
  const signature = await sign(`guest-pin:${period}`, secret);
  const number = ((signature[0] << 16) | (signature[1] << 8) | signature[2]) % 1000000;
  return String(number).padStart(6, "0");
}

async function currentGuestPin(secret) {
  return guestPinForPeriod(currentGuestPinPeriod(), secret);
}

function nextGuestPinRotation() {
  const nextPeriod = currentGuestPinPeriod() + 1;
  return nextPeriod * DAY_MS - SINGAPORE_UTC_OFFSET_MS;
}

async function createSession(role, password, secret, maxAge) {
  const payload = toBase64Url(JSON.stringify({
    role,
    expiresAt: Date.now() + maxAge * 1000,
    passwordId: await passwordFingerprint(password, secret),
  }));
  const signature = toBase64Url(await sign(payload, secret));
  return `${payload}.${signature}`;
}

async function readSession(request, ownerPassword, secret) {
  const cookieHeader = request.headers.get("cookie") || "";
  const cookie = cookieHeader
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${COOKIE_NAME}=`));

  if (!cookie) return null;

  try {
    const token = decodeURIComponent(cookie.slice(COOKIE_NAME.length + 1));
    const [payload, suppliedSignature] = token.split(".");
    if (!payload || !suppliedSignature) return null;

    const expectedSignature = toBase64Url(await sign(payload, secret));
    if (!(await safeEqual(suppliedSignature, expectedSignature))) return null;

    const data = JSON.parse(new TextDecoder().decode(fromBase64Url(payload)));
    if (!data.expiresAt || data.expiresAt <= Date.now()) return null;

    if (data.role === "guest") return data;
    if (data.role !== "owner") return null;

    const activePasswordId = await passwordFingerprint(ownerPassword, secret);
    return (await safeEqual(data.passwordId, activePasswordId)) ? data : null;
  } catch {
    return null;
  }
}

function loginPage(error = "") {
  const errorMessage = error
    ? '<div class="error" role="alert">That password isn\'t valid. Please try again.</div>'
    : "";

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="robots" content="noindex, nofollow, noarchive" />
    <title>Private access · Zakum Prequest Helper</title>
    <style>
      :root { color-scheme: dark; font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
      * { box-sizing: border-box; }
      body { min-height: 100vh; margin: 0; display: grid; place-items: center; padding: 24px; color: #e9eef7; background: radial-gradient(circle at 50% 0%, #3b4658 0, #252b34 48%, #1d222a 100%); }
      main { width: min(100%, 420px); padding: 34px; border: 1px solid rgba(255,255,255,.14); border-radius: 18px; background: rgba(49,56,70,.94); box-shadow: 0 24px 80px rgba(0,0,0,.35); }
      .icon { width: 48px; height: 48px; display: grid; place-items: center; margin-bottom: 22px; border-radius: 13px; background: #27303c; font-size: 24px; }
      h1 { margin: 0 0 10px; font-size: clamp(26px, 6vw, 34px); line-height: 1.08; letter-spacing: -.025em; }
      p { margin: 0 0 24px; color: #b6c0d1; line-height: 1.55; }
      label { display: block; margin-bottom: 8px; font-size: 14px; font-weight: 700; }
      input { width: 100%; height: 48px; padding: 0 14px; border: 1px solid rgba(255,255,255,.2); border-radius: 10px; background: #252c37; color: #fff; font: inherit; outline: none; }
      input:focus { border-color: #84aefc; box-shadow: 0 0 0 3px rgba(120,170,255,.25); }
      button { width: 100%; height: 48px; margin-top: 14px; border: 0; border-radius: 10px; background: #d7e3ff; color: #202731; font: inherit; font-weight: 800; cursor: pointer; }
      button:hover { filter: brightness(1.06); }
      .error { margin: 0 0 16px; padding: 10px 12px; border: 1px solid rgba(255,112,112,.4); border-radius: 9px; background: rgba(130,30,30,.24); color: #ffd5d5; font-size: 14px; }
      .note { margin: 16px 0 0; font-size: 12px; text-align: center; color: #8f9bad; }
    </style>
  </head>
  <body>
    <main>
      <div class="icon" aria-hidden="true">🔒</div>
      <h1>Private access</h1>
      <p>Enter the six-digit owner or guest PIN to open Sparrow's Zakum Prequest Helper.</p>
      ${errorMessage}
      <form method="post">
        <label for="password">PIN</label>
        <input id="password" name="password" type="password" inputmode="numeric" pattern="[0-9]{6}" maxlength="6" autocomplete="current-password" required autofocus />
        <button type="submit">Unlock helper</button>
      </form>
      <div class="note">This page is not available to the public.</div>
    </main>
  </body>
</html>`;
}

function htmlResponse(html, status = 200, headers = {}) {
  return new Response(html, {
    status,
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "no-store, private",
      "x-robots-tag": "noindex, nofollow, noarchive",
      ...headers,
    },
  });
}

export default async function middleware(request) {
  const ownerPassword = process.env.OWNER_PASSWORD;
  const secret = process.env.AUTH_SECRET;

  if (!ownerPassword || !secret) {
    return htmlResponse("<h1>Access is not configured</h1><p>The site owner needs to finish setting the private access credentials.</p>", 503);
  }

  const url = new URL(request.url);
  const session = await readSession(request, ownerPassword, secret);

  if (url.pathname === "/guest-pin") {
    if (session?.role !== "owner") {
      return new Response(JSON.stringify({ error: "Owner access required" }), {
        status: 403,
        headers: { "content-type": "application/json", "cache-control": "no-store" },
      });
    }

    return new Response(JSON.stringify({
      pin: await currentGuestPin(secret),
      rotatesAt: new Date(nextGuestPinRotation()).toISOString(),
      sessionHours: GUEST_SESSION_SECONDS / 3600,
    }), {
      headers: { "content-type": "application/json", "cache-control": "no-store, private" },
    });
  }

  if (url.pathname === "/logout") {
    return new Response(null, {
      status: 303,
      headers: {
        location: new URL("/", url).toString(),
        "set-cookie": `${COOKIE_NAME}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`,
        "cache-control": "no-store, private",
      },
    });
  }

  if (request.method === "POST") {
    const form = await request.formData();
    const suppliedPassword = String(form.get("password") || "");
    const isOwner = await safeEqual(suppliedPassword, ownerPassword);
    const guestPassword = await currentGuestPin(secret);
    const isGuest = await safeEqual(suppliedPassword, guestPassword);

    if (isOwner || isGuest) {
      const role = isOwner ? "owner" : "guest";
      const activePassword = isOwner ? ownerPassword : guestPassword;
      const maxAge = isOwner ? OWNER_SESSION_SECONDS : GUEST_SESSION_SECONDS;
      const session = await createSession(role, activePassword, secret, maxAge);
      return new Response(null, {
        status: 303,
        headers: {
          location: new URL("/", url).toString(),
          "set-cookie": `${COOKIE_NAME}=${encodeURIComponent(session)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAge}`,
          "cache-control": "no-store, private",
        },
      });
    }

    return htmlResponse(loginPage("invalid"), 401);
  }

  if (session) {
    return next({
      headers: {
        "cache-control": "no-store, private",
        "x-robots-tag": "noindex, nofollow, noarchive",
      },
    });
  }

  return htmlResponse(loginPage());
}

export const config = {
  matcher: "/((?!_vercel/).*)",
};
