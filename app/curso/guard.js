// Protege as páginas do curso. Sem sessão -> volta pro login.
// Enquanto o Supabase não estiver configurado, roda em modo dev (libera) pra navegar o protótipo.
(async function () {
  const c = window.ADP_CONFIG || {};
  const notConfigured = !c.SUPABASE_URL || c.SUPABASE_URL.includes("SEU-PROJETO");
  if (notConfigured || !window.supabase) {
    console.warn("[ADP] Supabase não configurado — guard em modo dev (acesso liberado).");
    return;
  }
  const sb = window.supabase.createClient(c.SUPABASE_URL, c.SUPABASE_ANON_KEY);
  window.__sb = sb;
  const { data: { session } } = await sb.auth.getSession();
  if (!session) { location.replace("/"); return; }
  // checa acesso ao curso (RLS já filtra pro próprio usuário). Fail-open em erro pra não trancar ninguém por bug de rede.
  try {
    const { data: acc, error: accErr } = await sb.from("course_access").select("course_id").limit(1);
    if (!accErr && (!acc || acc.length === 0)) {
      location.replace("https://rodrigobondioli.com/antipato"); // sem acesso -> página de vendas
      return;
    }
  } catch (e) { /* fail-open: conteúdo já é protegido no servidor */ }
})();
