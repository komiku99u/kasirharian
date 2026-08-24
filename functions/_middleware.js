export async function onRequest(context) {
  const url = new URL(context.request.url);

  // Halaman login dan API login/logout boleh diakses tanpa login
  if (
    url.pathname === "/login" ||
    url.pathname === "/login.html" ||
    url.pathname === "/api/login" ||
    url.pathname === "/api/logout"
  ) {
    return context.next();
  }

  // Ambil cookie session
  const cookie = context.request.headers.get("Cookie") || "";

  const match = cookie.match(
    /(?:^|;\s*)kasir_session=([^;]+)/
  );

  const session = match
    ? match[1]
    : null;

  // Belum login → arahkan ke login
  if (!session) {
    return Response.redirect(
      new URL("/login.html", url),
      302
    );
  }

  // Session ada → lanjutkan
  return context.next();
}
