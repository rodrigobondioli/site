export const config = { matcher: ['/', '/cursos', '/curso/:path*', '/admin', '/admin/:path*'] };

export default function middleware(request) {
  const host = (request.headers.get('host') || '').toLowerCase();
  if (host === 'app.rodrigobondioli.com') {
    const url = new URL(request.url);
    if (url.pathname === '/') {
      url.pathname = '/app/index.html';              // login
    } else if (url.pathname === '/cursos') {
      url.pathname = '/app/curso/cursos.html';        // vitrine pública (URL limpa)
    } else if (url.pathname.startsWith('/curso/')) {
      url.pathname = '/app' + url.pathname;           // /curso/x -> /app/curso/x
    } else if (url.pathname === '/admin' || url.pathname.startsWith('/admin/')) {
      url.pathname = '/app/admin/index.html';          // /admin -> painel do Rodrigo
    }
    return new Response(null, { headers: { 'x-middleware-rewrite': url.toString() } });
  }
  return new Response(null, { headers: { 'x-middleware-next': '1' } });
}
