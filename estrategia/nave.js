// Camada de dados do app de estratégia.
//
// Fala DIRETO com o Supabase (PostgREST via supabase-js), sem serverless function.
// Dois motivos: o plano Hobby da Vercel limita 12 functions e o projeto já usa as 12;
// e a segurança aqui é do banco, não da API — as policies de RLS filtram por
// `owner = auth.uid()`, e o trigger nave_enforce_gate recusa pular âncora.
//
// A interface (guard/get/post/catalogo) é a mesma de antes, então as telas não mudam.
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

  // Chame em toda página que exige login.
  async function guard() {
    const s = await getSession();
    if (!s) {
      const back = encodeURIComponent(location.pathname + location.search);
      location.replace(base() + '/login.html?next=' + back);
      return null;
    }
    return s.user;
  }

  // Caminho fixo: funciona nos dois hosts. Em estrategia.rodrigobondioli.com o
  // middleware serve /estrategia/<arquivo> igual; em rodrigobondioli.com é o caminho real.
  function base() { return '/estrategia'; }

  async function uid() {
    const s = await getSession();
    if (!s) throw new Error('Sem sessão. Faça login de novo.');
    return s.user.id;
  }

  // supabase-js devolve {data, error}; aqui erro vira exceção com a mensagem do Postgres
  // (é assim que a recusa da âncora chega até o toast da tela).
  function ok(res) {
    if (res.error) throw new Error(res.error.message || 'erro no banco');
    return res.data;
  }
  const one = (rows) => (Array.isArray(rows) ? rows[0] : rows) || null;

  // ------------------------------------------------------------------ leitura
  async function get(r, params = {}) {
    if (r === 'catalogo') return catalogo();

    if (r === 'projetos') {
      const projects = ok(await sb.from('nave_projects')
        .select('*, nave_clients(name,segment)')
        .order('created_at', { ascending: false }));
      if (!projects.length) return [];
      // progresso calculado aqui, sem view: view não herda RLS por padrão
      const fases = ok(await sb.from('nave_project_phases')
        .select('project_id,status,gate,nave_phases(ord,name)')
        .in('project_id', projects.map(p => p.id)));
      const agg = {};
      fases.forEach(f => {
        const a = (agg[f.project_id] ||= { total: 0, feitas: 0, esperando: false, lista: [] });
        a.total++;
        if (f.status === 'concluido') a.feitas++;
        if (f.gate === 'enviado') a.esperando = true;
        a.lista.push(f);
      });
      return projects.map(p => {
        const a = agg[p.id] || { total: 0, feitas: 0, esperando: false, lista: [] };
        a.lista.sort((x, y) => (x.nave_phases?.ord ?? 0) - (y.nave_phases?.ord ?? 0));
        const atual = a.lista.find(f => f.status !== 'concluido');
        return { ...p, progress: {
          pct: a.total ? a.feitas / a.total : 0,
          total: a.total, feitas: a.feitas,
          passo: atual ? (atual.nave_phases?.name || '') : '',
          awaiting_approval: a.esperando,
        } };
      });
    }

    if (r === 'projeto') {
      const id = params.id;
      if (!id) throw new Error('id é obrigatório.');
      const project = one(ok(await sb.from('nave_projects').select('*').eq('id', id)));
      if (!project) throw new Error('Projeto não encontrado.');
      const [client, phases, selection] = await Promise.all([
        sb.from('nave_clients').select('*').eq('id', project.client_id).then(ok).then(one),
        sb.from('nave_project_phases').select('*, nave_phases(*)').eq('project_id', id).then(ok),
        sb.from('nave_project_exercises').select('*').eq('project_id', id).then(ok),
      ]);
      const phaseIds = phases.map(p => p.id);
      const peIds = selection.map(s => s.id);
      const [tasks, responses] = await Promise.all([
        phaseIds.length
          ? sb.from('nave_project_tasks').select('*').in('project_phase_id', phaseIds).order('ord').then(ok)
          : [],
        peIds.length
          ? sb.from('nave_exercise_responses').select('*').in('project_exercise_id', peIds).then(ok)
          : [],
      ]);
      phases.sort((a, b) => (a.nave_phases?.ord ?? 0) - (b.nave_phases?.ord ?? 0));
      return { project, client, phases, tasks, selection, responses };
    }

    throw new Error('rota desconhecida: ' + r);
  }

  // ------------------------------------------------------------------ escrita
  async function post(r, body = {}) {
    if (r === 'cliente') {
      if (!body.name) throw new Error('Nome do cliente é obrigatório.');
      return one(ok(await sb.from('nave_clients').insert({
        owner: await uid(),
        name: body.name,
        segment: body.segment ?? null,
        contact: body.contact ?? null,
        email: body.email ?? null,
        brand_exists: body.brand_exists !== false,
        notes: body.notes ?? null,
      }).select()));
    }

    // Cria o projeto E instancia as 16 fases com as 135 tarefas.
    // É aqui que o método vira checklist: você não monta nada à mão.
    if (r === 'projeto') {
      const project = one(ok(await sb.from('nave_projects').insert({
        owner: await uid(),
        client_id: body.client_id,
        name: body.name || 'Projeto de marca',
        started_at: body.started_at || null,
        target_end: body.target_end || null,
      }).select()));

      const phases = ok(await sb.from('nave_phases').select('id,ord').order('ord'));
      const criadas = ok(await sb.from('nave_project_phases')
        .insert(phases.map(p => ({ project_id: project.id, phase_id: p.id })))
        .select());

      const templates = ok(await sb.from('nave_task_templates').select('*').order('phase_id').order('ord'));
      const porFase = Object.fromEntries(criadas.map(p => [p.phase_id, p.id]));
      const rows = templates.filter(t => porFase[t.phase_id]).map(t => ({
        project_phase_id: porFase[t.phase_id],
        template_id: t.id,
        ord: t.ord,
        title: t.title,
        detail: t.detail ?? null,
      }));
      if (rows.length) ok(await sb.from('nave_project_tasks').insert(rows));

      return { project, phases: criadas.length, tasks: rows.length };
    }

    if (r === 'projeto_upd') {
      const patch = pick(body, ['main_objective', 'point_a', 'point_b', 'status',
        'drive_folder_id', 'calendar_id', 'name', 'started_at', 'target_end']);
      return one(ok(await sb.from('nave_projects').update(patch).eq('id', body.id).select()));
    }

    if (r === 'fase') {
      const patch = pick(body, ['status', 'gate', 'gate_note', 'gate_evidence_url',
        'planned_start', 'planned_end', 'drive_folder_id']);
      const agora = new Date().toISOString();
      if (body.status === 'em_andamento') patch.started_at = agora;
      if (body.status === 'concluido') patch.completed_at = agora;
      if (body.gate === 'aprovado') patch.approved_at = agora;
      // Se a âncora anterior não estiver aprovada, o trigger recusa e a mensagem sobe daqui.
      return one(ok(await sb.from('nave_project_phases').update(patch).eq('id', body.id).select()));
    }

    if (r === 'tarefa') {
      const patch = pick(body, ['status', 'due_date', 'link_url', 'title', 'detail']);
      if (body.status === 'concluido') patch.completed_at = new Date().toISOString();
      else if (body.status) patch.completed_at = null;
      return one(ok(await sb.from('nave_project_tasks').update(patch).eq('id', body.id).select()));
    }

    // Seleção de exercícios do workshop. A justificativa fica registrada:
    // o método manda escolher a partir das entrevistas, não do gosto.
    if (r === 'selecao') {
      const items = Array.isArray(body.items) ? body.items : [];
      if (!items.length) return { ok: true, count: 0, items: [] };
      const rows = items.map(i => ({
        project_id: body.project_id,
        exercise_id: i.exercise_id,
        selected: !!i.selected,
        rationale: i.rationale ?? null,
        instance_label: i.instance_label ?? null,
      }));
      const saved = ok(await sb.from('nave_project_exercises')
        .upsert(rows, { onConflict: 'project_id,exercise_id' }).select());
      return { ok: true, count: saved.length, items: saved };
    }

    if (r === 'resposta') {
      const values = body.values || {};
      const rows = Object.entries(values).map(([field_key, value]) => ({
        project_exercise_id: body.project_exercise_id,
        field_key,
        value: value ?? null,
        updated_at: new Date().toISOString(),
      }));
      if (!rows.length) return { ok: true, count: 0 };
      ok(await sb.from('nave_exercise_responses')
        .upsert(rows, { onConflict: 'project_exercise_id,field_key' }));
      if (body.status) {
        ok(await sb.from('nave_project_exercises')
          .update({ status: body.status }).eq('id', body.project_exercise_id));
      }
      return { ok: true, count: rows.length };
    }

    if (r === 'insight') {
      return one(ok(await sb.from('nave_insights').insert(
        pick(body, ['project_id', 'source', 'data_point', 'pattern', 'tension', 'is_symptom',
          'opportunity', 'hypothesis', 'status', 'becomes_block', 'ai_generated'])
      ).select()));
    }

    throw new Error('rota desconhecida: ' + r);
  }

  // O catálogo não muda por projeto — vale cachear na sessão do navegador.
  async function catalogo() {
    const hit = sessionStorage.getItem('nave:catalogo');
    if (hit) { try { return JSON.parse(hit); } catch {} }
    const [phases, tasks, exercises, fields] = await Promise.all([
      sb.from('nave_phases').select('*').order('ord').then(ok),
      sb.from('nave_task_templates').select('*').order('phase_id').order('ord').then(ok),
      sb.from('nave_exercises').select('*').order('id').then(ok),
      sb.from('nave_exercise_fields').select('*').order('exercise_id').order('ord').then(ok),
    ]);
    const data = { phases, tasks, exercises, fields };
    try { sessionStorage.setItem('nave:catalogo', JSON.stringify(data)); } catch {}
    return data;
  }

  function pick(obj, keys) {
    const out = {};
    for (const k of keys) if (obj[k] !== undefined) out[k] = obj[k];
    return out;
  }

  window.NAVE = {
    sb, guard, getSession, get, post, catalogo, base,
    async login(email) {
      if (!sb) throw new Error('Supabase não configurado.');
      const { error } = await sb.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: location.origin + base() + '/' },
      });
      if (error) throw error;
    },
    async logout() {
      if (sb) await sb.auth.signOut();
      session = null;
      sessionStorage.removeItem('nave:catalogo');
      location.replace(base() + '/login.html');
    },
  };
})();
