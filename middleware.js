export const config = { matcher: '/' };

export default function middleware(request) {
  const host = (request.headers.get('host') || '').toLowerCase();
  if (host === 'app.rodrigobondioli.com') {
    const url = new URL(request.url);
    url.pathname = '/app/index.html';
    return new Response(null, {
      headers: { 'x-middleware-rewrite': url.toString() },
    });
  }
  return new Response(null, { headers: { 'x-middleware-next': '1' } });
}
