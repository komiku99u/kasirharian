export async function onRequestGet() {
  return new Response(null, {
    status: 302,

    headers: {
      Location: "/login",

      "Set-Cookie":
        "kasir_session=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax",
    },
  });
}
