// Helper client-side: pega o token da sessão Supabase e chama /api/*
window.ADP = (function () {
  const c = window.ADP_CONFIG || {};
  const devMode = !c.SUPABASE_URL || String(c.SUPABASE_URL).includes("SEU-PROJETO");
  function sb() {
    return window.__sb || (window.supabase && c.SUPABASE_URL
      ? window.supabase.createClient(c.SUPABASE_URL, c.SUPABASE_ANON_KEY) : null);
  }
  async function token() {
    const s = sb(); if (!s) return null;
    const { data } = await s.auth.getSession();
    return data?.session?.access_token || null;
  }
  async function api(path, opts = {}) {
    const t = await token();
    const headers = Object.assign({ "Content-Type": "application/json" }, opts.headers || {},
      t ? { Authorization: "Bearer " + t } : {});
    const r = await fetch(path, Object.assign({}, opts, { headers }));
    let j = {}; try { j = await r.json(); } catch {}
    if (!r.ok) throw new Error(j.error || ("HTTP " + r.status));
    return j;
  }
  const COURSE = "p1-generico-especialista";
  return {
    devMode,
    api,
    COURSE,
    loadCanvas: (course = COURSE) => api("/api/canvas?course=" + encodeURIComponent(course)),
    saveBlock: (block, data, course = COURSE) =>
      api("/api/canvas", { method: "POST", body: JSON.stringify({ course, block, data }) }),
    estrategista: (canvas) => api("/api/ai/estrategista", { method: "POST", body: JSON.stringify({ canvas }) }),
    ruminacao: (nicho, cliente) => api("/api/ai/ruminacao", { method: "POST", body: JSON.stringify({ nicho, cliente }) }),
    // aulas + progresso
    lessons: (course = COURSE) => api("/api/lessons?course=" + encodeURIComponent(course)),
    progress: (course = COURSE) => api("/api/progress?course=" + encodeURIComponent(course)),
    setDone: (lesson_id, done = true, course = COURSE) =>
      api("/api/progress", { method: "POST", body: JSON.stringify({ course, lesson_id, done }) }),
    // perfil (do próprio Supabase auth)
    me: async () => { const s = sb(); if (!s) return null; const { data } = await s.auth.getUser(); return data?.user || null; },
  };
})();
