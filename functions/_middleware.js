export async function onRequest(context) {
  const url = new URL(context.request.url);

  /*
   * ==========================================
   * HALAMAN / API YANG BOLEH DIAKSES TANPA LOGIN
   * ==========================================
   */

  const publicPaths = [
    "/login",
    "/login/",
    "/login.html",
    "/api/login",
    "/api/logout",
  ];

  if (publicPaths.includes(url.pathname)) {
    return context.next();
  }


  /*
   * ==========================================
   * FILE STATIS YANG BOLEH DIAKSES
   * ==========================================
   */

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
      url.pathname
        .toLowerCase()
        .endsWith(ext)
    )
  ) {
    return context.next();
  }


  /*
   * ==========================================
   * CEK COOKIE SESSION
   * ==========================================
   */

  const cookie =
    context.request.headers.get("Cookie") || "";

  const match = cookie.match(
    /(?:^|;\s*)kasir_session=([^;]+)/
  );

  const session =
    match ? match[1] : null;


  /*
   * ==========================================
   * BELUM LOGIN
   * ==========================================
   */

  if (!session) {
    return Response.redirect(
      new URL("/login", url),
      302
    );
  }


  /*
   * ==========================================
   * VALIDASI SESSION
   * ==========================================
   */

  const valid =
    await verifySession(
      session,
      context.env.AUTH_PASSWORD
    );


  /*
   * ==========================================
   * SESSION TIDAK VALID / EXPIRED
   * ==========================================
   */

  if (!valid) {
    return new Response(null, {
      status: 302,

      headers: {
        Location: "/login",

        "Set-Cookie":
          "kasir_session=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax",
      },
    });
  }


  /*
   * ==========================================
   * SUDAH LOGIN
   * ==========================================
   */

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
    const parts =
      token.split(".");

    if (parts.length !== 2) {
      return false;
    }

    const payload =
      parts[0];

    const signature =
      parts[1];

    const data =
      JSON.parse(
        decodeBase64Url(payload)
      );


    /*
     * Session berlaku 7 hari
     */

    const sekarang =
      Date.now();

    if (
      !data.exp ||
      sekarang > data.exp
    ) {
      return false;
    }


    /*
     * Buat signature yang seharusnya
     */

    const expected =
      await sign(
        payload,
        secret
      );


    /*
     * Bandingkan signature
     */

    return timingSafeEqual(
      signature,
      expected
    );

  } catch {
    return false;
  }
}


/* =========================================================
   HMAC SHA-256
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
      binary += String.fromCharCode(
        byte
      );
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
