export async function onRequestPost(context) {
  try {
    const request = context.request;

    // Pastikan request menggunakan POST
    if (request.method !== "POST") {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Method tidak diizinkan",
        }),
        {
          status: 405,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    // Ambil data login
    const body = await request.json();

    const username = String(
      body.username || ""
    ).trim();

    const password = String(
      body.password || ""
    );

    // Cek kelengkapan
    if (!username || !password) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Username dan password wajib diisi",
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    // Ambil username dan password dari Cloudflare Secrets
    const validUsername =
      context.env.AUTH_USERNAME;

    const validPassword =
      context.env.AUTH_PASSWORD;

    // Validasi username dan password
    if (
      username !== validUsername ||
      password !== validPassword
    ) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Username atau password salah",
        }),
        {
          status: 401,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    /*
     * Buat session berlaku 7 hari.
     */
    const payload = JSON.stringify({
      iat: Date.now(),
      exp:
        Date.now() +
        7 * 24 * 60 * 60 * 1000,
    });

    /*
     * Encode payload menjadi Base64URL.
     */
    const encodedPayload =
      base64UrlEncode(payload);

    /*
     * Buat signature HMAC-SHA256
     * menggunakan password sebagai secret.
     */
    const signature =
      await sign(
        encodedPayload,
        validPassword
      );

    /*
     * Format:
     *
     * payload.signature
     */
    const session =
      encodedPayload +
      "." +
      signature;

    /*
     * Simpan session sebagai cookie.
     */
    const cookie =
      [
        `kasir_session=${session}`,
        "Path=/",
        "HttpOnly",
        "Secure",
        "SameSite=Lax",
        "Max-Age=604800",
      ].join("; ");

    return new Response(
      JSON.stringify({
        success: true,
        message: "Login berhasil",
      }),
      {
        status: 200,
        headers: {
          "Content-Type":
            "application/json",
          "Set-Cookie": cookie,
        },
      }
    );
  } catch (error) {
    console.error(
      "Login error:",
      error
    );

    return new Response(
      JSON.stringify({
        success: false,
        message: "Terjadi kesalahan server",
      }),
      {
        status: 500,
        headers: {
          "Content-Type":
            "application/json",
        },
      }
    );
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

  return arrayBufferToBase64Url(
    signature
  );
}


/* =========================================================
   BASE64URL
   ========================================================= */

function base64UrlEncode(text) {
  const bytes =
    new TextEncoder().encode(text);

  return arrayBufferToBase64Url(
    bytes
  );
}


function arrayBufferToBase64Url(
  buffer
) {
  const bytes =
    new Uint8Array(buffer);

  let binary = "";

  for (
    let i = 0;
    i < bytes.length;
    i++
  ) {
    binary += String.fromCharCode(
      bytes[i]
    );
  }

  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}
