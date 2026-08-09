// API do app de estratégia (N.A.V.E.) — estrategia.rodrigobondioli.com
// Uma única função serverless. A ação vai em ?r= (GET) ou body.r (POST).
//
// GET  ?r=catalogo                       -> fases + tarefas-modelo + instrumentos + campos
// GET  ?r=projetos                       -> lista de projetos com progresso
// GET  ?r=projeto&id=<uuid>              -> projeto completo (fases, tarefas, seleção, respostas)
// POST  r=cliente   {name, segment, email, contact, brand_exists, notes}
// POST  r=projeto   {client_id, name, started_at, target_end}   -> cria e instancia as 16 fases
// POST  r=projeto_upd {id, main_objective, point_a, point_b, status, drive_folder_id, calendar_id}
// POST  r=fase      {id, status?, gate?, gate_note?, gate_evidence_url?, planned_start?, planned_end?}
// POST  r=tarefa    {id, status?, due_date?, link_url?}
// POST  r=selecao   {project_id, items:[{exercise_id, selected, rationale, instance_label}]}
// POST  r=resposta  {project_exercise_id, values:{campo: valor}}
// POST  r=insight   {project_id, ...}
//
// O gate é regra de banco (trigger nave_enforce_gate). Se a fase anterior com
// âncora não estiver aprovada, o Postgres recusa e a mensagem sobe pro cliente.
import { getUser } from './_auth.js';

const SB = () => ({ url: process.env.SUPABASE_URL, svc: process.env.SUPABASE_SERVICE_ROLE });

// PostgREST com service role. O escopo por dono é feito aqui, na mão,
// porque a service role passa por cima do RLS.
async function db(path, init = {}) {
  const { url, svc } = SB();
  const r = await fetch(`${url}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: svc,
      Authorization: `Bearer ${svc}`,
      'Content-Type': 'application/json',
      ...(init.headers || {}),
    },
  });
  const text = await r.text();
  let body = null;
  if (text) { try { body = JSON.parse(text); } catch { body = text; } }
  if (!r.ok) {
    const msg = (body && (body.message || body.hint)) || (typeof body === 'string' ? body : 'erro no banco');
    const e = new Error(msg); e.status = r.status; e.detail = body; throw e;
  }
  return body;
}

const one = (rows) => (Array.isArray(rows) ? rows[0] : rows) || null;
const REP = { Prefer: 'return=representation' };

// Confere que o projeto é do usuário logado. Devolve o projeto.
async function ownedProject(id, owner) {
  const p = one(await db(`nave_projects?id=eq.${id}&owner=eq.${owner}&select=*`));
  if (!p) { const e = new Error('Projeto não encontrado.'); e.status = 404; throw e; }
  return p;
}

export default async function handler(req, res) {
  const user = await getUser(req);
  if (!user) return res.status(401).json({ error: 'Faça login.' });
  const { url, svc } = SB();
  if (!url || !svc) return res.status(500).json({ error: 'Supabase não configurado.' });
  const owner = user.id;

  try {
    if (req.method === 'GET') return res.status(200).json(await get(req, owner));
    if (req.method === 'POST') {
      let body = req.body;
      if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = {}; } }
      return res.status(200).json(await post(body || {}, owner));
    }
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (e) {
    return res.status(e.status || 500).json({ error: e.message || 'erro' });
  }
}

// ---------------------------------------------------------------- GET
async function get(req, owner) {
  const r = req.query?.r || 'projetos';

  if (r === 'catalogo') {
    const [phases, tasks, exercises, fields] = await Promise.all([
      db('nave_phases?select=*&order=ord'),
      db('nave_task_templates?select=*&order=phase_id,ord'),
      db('nave_exercises?select=*&order=id'),
      db('nave_exercise_fields?select=*&order=exercise_id,ord'),
    ]);
    return { phases, tasks, exercises, fields };
  }

  if (r === 'projetos') {
    const projects = await db(
      `nave_projects?owner=eq.${owner}&select=*,nave_clients(name,segment)&order=created_at.desc`);
    const ids = projects.map((p) => p.id);
    let prog = [];
    if (ids.length) {
      prog = await db(`nave_v_project_progress?project_id=in.(${ids.join(',')})&select=*`);
    }
    const byId = Object.fromEntries(prog.map((x) => [x.project_id, x]));
    return projects.map((p) => ({ ...p, progress: byId[p.id] || null }));
  }

  if (r === 'projeto') {
    const id = req.query?.id;
    if (!id) { const e = new Error('id é obrigatório.'); e.status = 400; throw e; }
    const project = await ownedProject(id, owner);
    const [client, phases, selection] = await Promise.all([
      db(`nave_clients?id=eq.${project.client_id}&select=*`).then(one),
      db(`nave_project_phases?project_id=eq.${id}&select=*,nave_phases(*)`),
      db(`nave_project_exercises?project_id=eq.${id}&select=*`),
    ]);
    const phaseIds = phases.map((p) => p.id);
    const peIds = selection.map((s) => s.id);
    const [tasks, responses] = await Promise.all([
      phaseIds.length
        ? db(`nave_project_tasks?project_phase_id=in.(${phaseIds.join(',')})&select=*&order=ord`)
        : [],
      peIds.length
        ? db(`nave_exercise_responses?project_exercise_id=in.(${peIds.join(',')})&select=*`)
        : [],
    ]);
    phases.sort((a, b) => (a.nave_phases?.ord ?? 0) - (b.nave_phases?.ord ?? 0));
    return { project, client, phases, tasks, selection, responses };
  }

  const e = new Error(`rota desconhecida: ${r}`); e.status = 400; throw e;
}

// --------------------------------------------------------------- POST
async function post(body, owner) {
  const r = body.r;

  if (r === 'cliente') {
    if (!body.name) { const e = new Error('name é obrigatório.'); e.status = 400; throw e; }
    return one(await db('nave_clients', {
      method: 'POST', headers: REP,
      body: JSON.stringify({
        owner,
        name: body.name,
        segment: body.segment ?? null,
        contact: body.contact ?? null,
        email: body.email ?? null,
        brand_exists: body.brand_exists !== false,
        notes: body.notes ?? null,
      }),
    }));
  }

  // Cria o projeto E instancia as 16 fases com as 135 tarefas.
  // É aqui que o método vira checklist: o usuário não monta nada à mão.
  if (r === 'projeto') {
    const client = one(await db(`nave_clients?id=eq.${body.client_id}&owner=eq.${owner}&select=id`));
    if (!client) { const e = new Error('Cliente não encontrado.'); e.status = 404; throw e; }

    const project = one(await db('nave_projects', {
      method: 'POST', headers: REP,
      body: JSON.stringify({
        owner,
        client_id: body.client_id,
        name: body.name || 'Projeto de marca',
        started_at: body.started_at ?? null,
        target_end: body.target_end ?? null,
      }),
    }));

    const phases = await db('nave_phases?select=id,ord&order=ord');
    const createdPhases = await db('nave_project_phases', {
      method: 'POST', headers: REP,
      body: JSON.stringify(phases.map((p) => ({ project_id: project.id, phase_id: p.id }))),
    });

    const templates = await db('nave_task_templates?select=*&order=phase_id,ord');
    const phaseRow = Object.fromEntries(createdPhases.map((p) => [p.phase_id, p.id]));
    const rows = templates
      .filter((t) => phaseRow[t.phase_id])
      .map((t) => ({
        project_phase_id: phaseRow[t.phase_id],
        template_id: t.id,
        ord: t.ord,
        title: t.title,
        detail: t.detail ?? null,
      }));
    if (rows.length) await db('nave_project_tasks', { method: 'POST', body: JSON.stringify(rows) });

    return { project, phases: createdPhases.length, tasks: rows.length };
  }

  if (r === 'projeto_upd') {
    await ownedProject(body.id, owner);
    const patch = pick(body, ['main_objective', 'point_a', 'point_b', 'status',
      'drive_folder_id', 'calendar_id', 'name', 'started_at', 'target_end']);
    return one(await db(`nave_projects?id=eq.${body.id}`, {
      method: 'PATCH', headers: REP, body: JSON.stringify(patch),
    }));
  }

  if (r === 'fase') {
    const row = one(await db(`nave_project_phases?id=eq.${body.id}&select=project_id`));
    if (!row) { const e = new Error('Fase não encontrada.'); e.status = 404; throw e; }
    await ownedProject(row.project_id, owner);
    const patch = pick(body, ['status', 'gate', 'gate_note', 'gate_evidence_url',
      'planned_start', 'planned_end', 'drive_folder_id']);
    if (body.status === 'em_andamento') patch.started_at = new Date().toISOString();
    if (body.status === 'concluido') patch.completed_at = new Date().toISOString();
    if (body.gate === 'aprovado') patch.approved_at = new Date().toISOString();
    // Se o trigger recusar (âncora anterior pendente), a mensagem do Postgres sobe como 400.
    return one(await db(`nave_project_phases?id=eq.${body.id}`, {
      method: 'PATCH', headers: REP, body: JSON.stringify(patch),
    }));
  }

  if (r === 'tarefa') {
    const t = one(await db(`nave_project_tasks?id=eq.${body.id}&select=project_phase_id`));
    if (!t) { const e = new Error('Tarefa não encontrada.'); e.status = 404; throw e; }
    const pp = one(await db(`nave_project_phases?id=eq.${t.project_phase_id}&select=project_id`));
    await ownedProject(pp.project_id, owner);
    const patch = pick(body, ['status', 'due_date', 'link_url', 'title', 'detail']);
    if (body.status === 'concluido') patch.completed_at = new Date().toISOString();
    if (body.status && body.status !== 'concluido') patch.completed_at = null;
    return one(await db(`nave_project_tasks?id=eq.${body.id}`, {
      method: 'PATCH', headers: REP, body: JSON.stringify(patch),
    }));
  }

  // Seleção de exercícios do workshop. rationale é obrigatório quando selected=true:
  // o método manda escolher a partir das entrevistas, e a justificativa fica registrada.
  if (r === 'selecao') {
    await ownedProject(body.project_id, owner);
    const items = Array.isArray(body.items) ? body.items : [];
    if (!items.length) return { ok: true, count: 0 };
    const rows = items.map((i) => ({
      project_id: body.project_id,
      exercise_id: i.exercise_id,
      selected: !!i.selected,
      rationale: i.rationale ?? null,
      instance_label: i.instance_label ?? null,
    }));
    const saved = await db('nave_project_exercises?on_conflict=project_id,exercise_id', {
      method: 'POST',
      headers: { ...REP, Prefer: 'resolution=merge-duplicates,return=representation' },
      body: JSON.stringify(rows),
    });
    return { ok: true, count: saved.length, items: saved };
  }

  if (r === 'resposta') {
    const pe = one(await db(`nave_project_exercises?id=eq.${body.project_exercise_id}&select=project_id`));
    if (!pe) { const e = new Error('Exercício do projeto não encontrado.'); e.status = 404; throw e; }
    await ownedProject(pe.project_id, owner);
    const values = body.values || {};
    const rows = Object.entries(values).map(([field_key, value]) => ({
      project_exercise_id: body.project_exercise_id,
      field_key,
      value: value ?? null,
      updated_at: new Date().toISOString(),
    }));
    if (!rows.length) return { ok: true, count: 0 };
    await db('nave_exercise_responses?on_conflict=project_exercise_id,field_key', {
      method: 'POST',
      headers: { Prefer: 'resolution=merge-duplicates' },
      body: JSON.stringify(rows),
    });
    if (body.status) {
      await db(`nave_project_exercises?id=eq.${body.project_exercise_id}`, {
        method: 'PATCH', body: JSON.stringify({ status: body.status }),
      });
    }
    return { ok: true, count: rows.length };
  }

  if (r === 'insight') {
    await ownedProject(body.project_id, owner);
    return one(await db('nave_insights', {
      method: 'POST', headers: REP,
      body: JSON.stringify(pick(body, ['project_id', 'source', 'data_point', 'pattern', 'tension',
        'is_symptom', 'opportunity', 'hypothesis', 'status', 'becomes_block', 'ai_generated'])),
    }));
  }

  const e = new Error(`rota desconhecida: ${r}`); e.status = 400; throw e;
}

function pick(obj, keys) {
  const out = {};
  for (const k of keys) if (obj[k] !== undefined) out[k] = obj[k];
  return out;
}
