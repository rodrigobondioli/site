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
  // opcional (quando o schema existir): checar acesso ao curso
  // const { data: acc } = await sb.from("course_access").select("course_id").eq("course_id","p1-generico-especialista").maybeSingle();
  // if (!acc) location.replace("https://www.rodrigobondioli.com/antipato/"); // sem acesso -> LP
})();
