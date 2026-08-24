export async function onRequest(context) {
  const url = new URL(context.request.url);

  // Halaman dan API yang boleh diakses tanpa login
  const publicPaths = [
    "/login.html",
    "/api/login",
    "/api/logout",
  ];

  if (publicPaths.includes(url.pathname)) {
    return context.next();
  }

  // File statis yang diperlukan halaman
  const publicExtensions = [
    ".css",
    ".js",
    ".ico",
    ".png",
    ".jpg",
    ".jpeg",
    ".webp",
    ".svg",
    ".gif",
  ];

  if (
    publicExtensions.some((ext) =>
      url.pathname.toLowerCase().endsWith(ext)
    )
  ) {
    return context.next();
  }

  // Ambil session cookie
  const cookie =
    context.request.headers.get("Cookie") || "";

  const match = cookie.match(
    /(?:^|;\s*)kasir_session=([^;]+)/
  );

  const session = match ? match[1] : null;

  // Belum login
  if (!session) {
    return Response.redirect(
      new URL("/login.html", url),
      302
    );
  }

  // Validasi session
  const valid = await verifySession(
    session,
    context.env.AUTH_PASSWORD
  );

  if (!valid) {
    return new Response(
      null,
      {
        status: 302,
        headers: {
          Location: "/login.html",
          "Set-Cookie":
            "kasir_session=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax",
        },
      }
    );
  }

  return context.next();
}


/* =========================================================
   VALIDASI SESSION
   ========================================================= */

async function verifySession(
  token,
  secret
) {
  try {
    const parts = token.split(".");

    if (parts.length !== 2) {
      return false;
    }

    const payload = parts[0];
    const signature = parts[1];

    const data = JSON.parse(
      decodeBase64Url(payload)
    );

    // Session berlaku 7 hari
    const sekarang = Date.now();

    if (
      !data.exp ||
      sekarang > data.exp
    ) {
      return false;
    }

    const expected =
      await sign(
        payload,
        secret
      );

    return timingSafeEqual(
      signature,
      expected
    );
  } catch {
    return false;
  }
}


/* =========================================================
   HMAC SIGNATURE
   ========================================================= */

async function sign(
  text,
  secret
) {
  const encoder =
    new TextEncoder();

  const key =
    await crypto.subtle.importKey(
      "raw",
      encoder.encode(secret),
      {
        name: "HMAC",
        hash: "SHA-256",
      },
      false,
      ["sign"]
    );

  const signature =
    await crypto.subtle.sign(
      "HMAC",
      key,
      encoder.encode(text)
    );

  return base64Url(
    new Uint8Array(signature)
  );
}


/* =========================================================
   BASE64URL
   ========================================================= */

function base64Url(bytes) {
  let binary = "";

  bytes.forEach(
    (byte) => {
      binary += String.fromCharCode(byte);
    }
  );

  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}


function decodeBase64Url(text) {
  text = text
    .replace(/-/g, "+")
    .replace(/_/g, "/");

  while (
    text.length % 4
  ) {
    text += "=";
  }

  return atob(text);
}


/* =========================================================
   CONSTANT-TIME COMPARISON
   ========================================================= */

function timingSafeEqual(
  a,
  b
) {
  if (a.length !== b.length) {
    return false;
  }

  let result = 0;

  for (
    let i = 0;
    i < a.length;
    i++
  ) {
    result |=
      a.charCodeAt(i) ^
      b.charCodeAt(i);
  }

  return result === 0;
}
