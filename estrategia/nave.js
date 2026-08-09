// Camada de dados do app de estratégia.
// Sessão via Supabase (link mágico), leitura e escrita via /api/nave.
// Sem sessão -> manda pro login. Sem rede -> cai no cache local e avisa.
(function () {
  const c = window.NAVE_CONFIG || {};
  const ready = c.SUPABASE_URL && window.supabase;
  const sb = ready ? window.supabase.createClient(c.SUPABASE_URL, c.SUPABASE_ANON_KEY) : null;

  let session = null;

  async function getSession() {
    if (!sb) return null;
    if (session) return session;
    const { data } = await sb.auth.getSession();
    session = data?.session || null;
    return session;
  }

  // Chama em toda página que exige login. Redireciona se não houver sessão.
  async function guard() {
    const s = await getSession();
    if (!s) {
      const back = encodeURIComponent(location.pathname + location.search);
      location.replace('/login.html?next=' + back);
      return null;
    }
    return s.user;
  }

  async function api(path, opts = {}) {
    const s = await getSession();
    if (!s) throw new Error('sem sessão');
    const r = await fetch('/api/nave' + path, {
      ...opts,
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + s.access_token,
        ...(opts.headers || {}),
      },
    });
    const j = await r.json().catch(() => null);
    if (!r.ok) throw new Error((j && j.error) || 'erro na API');
    return j;
  }

  const get = (r, params = {}) => {
    const q = new URLSearchParams({ r, ...params }).toString();
    return api('?' + q);
  };
  const post = (r, body = {}) =>
    api('', { method: 'POST', body: JSON.stringify({ r, ...body }) });

  // O catálogo não muda por projeto — vale cachear na sessão do navegador.
  async function catalogo() {
    const hit = sessionStorage.getItem('nave:catalogo');
    if (hit) { try { return JSON.parse(hit); } catch {} }
    const data = await get('catalogo');
    try { sessionStorage.setItem('nave:catalogo', JSON.stringify(data)); } catch {}
    return data;
  }

  // Salvamento com debounce: o formulário chama a cada tecla, isto agrupa.
  function autosave(delay = 900) {
    const pend = new Map();
    let timer = null, onState = () => {};
    async function flush() {
      timer = null;
      const batch = [...pend.entries()];
      pend.clear();
      if (!batch.length) return;
      onState('salvando');
      try {
        for (const [peId, values] of batch) {
          await post('resposta', { project_exercise_id: peId, values });
        }
        onState('salvo');
      } catch (e) {
        // não perde o que o usuário digitou: devolve pra fila e guarda local
        for (const [peId, values] of batch) {
          const prev = pend.get(peId) || {};
          pend.set(peId, { ...values, ...prev });
          try { localStorage.setItem('nave:pendente:' + peId, JSON.stringify(pend.get(peId))); } catch {}
        }
        onState('offline');
      }
    }
    return {
      onState(fn) { onState = fn; return this; },
      set(peId, key, value) {
        const cur = pend.get(peId) || {};
        cur[key] = value;
        pend.set(peId, cur);
        clearTimeout(timer);
        timer = setTimeout(flush, delay);
      },
      flush,
    };
  }

  window.NAVE = {
    sb, guard, getSession, get, post, catalogo, autosave,
    async login(email) {
      if (!sb) throw new Error('Supabase não configurado.');
      const { error } = await sb.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: (c.APP_ORIGIN || location.origin) + '/' },
      });
      if (error) throw error;
    },
    async logout() {
      if (sb) await sb.auth.signOut();
      session = null;
      sessionStorage.removeItem('nave:catalogo');
      location.replace('/login.html');
    },
  };
})();
