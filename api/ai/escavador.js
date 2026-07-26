// 🛠️ O Escavador — conduz a Aula 1 (VOCÊ). Entrevista conversacional, 1 pergunta por vez, extrai o schema `voce`.
//
// ARQUITETURA (fonte de verdade ÚNICA): o SERVIDOR é o cérebro.
//   - decide()      → decide, de forma DETERMINÍSTICA, qual é a próxima área/gap, se pode pular, se pode encerrar. (código, não IA)
//   - questionFor() → a pergunta é um TEMPLATE contextual (usa as palavras do próprio aluno). Nunca genérica, nunca da área errada.
//   - a IA faz UMA coisa só: EXTRAIR o que o aluno acabou de dizer pros campos do schema (+ um "ack" curto opcional). Ela NÃO decide o fluxo.
//   - o CLIENTE é BURRO: só renderiza o que o servidor devolve (área, pergunta, pode_pular, fechado). Não recomputa gap, não injeta pergunta fixa.
// Isso mata: repetir pergunta já respondida, ignorar resposta, área errada no cabeçalho, encerrar cedo, prompt×cliente disputando o fluxo.
//
// Servidor STATELESS: o cliente guarda o estado (history + voce, incluindo _skip) e manda a cada turno.
// Ponte de compatibilidade: withLegacy() sintetiza os campos legados (mundos/forte/turmas/historia) que Canvas/Estrategista já leem.
import { getUser, aiRateOk, ai, extractJSON, MODEL_FAST } from '../_auth.js';

// A IA só EXTRAI. Não decide pergunta, não conduz fluxo.
export const SYSTEM = `Você é "O Escavador", o extrator da Aula 1 (VOCÊ) do curso De Genérico a Especialista (Rodrigo Bondioli).
Voz nos textos: direta, seca, anti-guru, tiozão sem frescura. Sem emoji, sem motivação, sem floreio.

## SUA ÚNICA FUNÇÃO
LER a última resposta do aluno e EXTRAIR o que der pros campos do schema. Você NÃO escolhe a próxima pergunta — quem faz isso é o sistema. NÃO faça perguntas. NÃO conduza a conversa. Só extraia + dê uma reação curtíssima ("ack") se couber.

## O QUE CADA CAMPO GUARDA
- comunidades: mercado/comunidade/tipo de cliente. Campos:
  · "nome" = o mercado/mundo.
  · "relacao" = como o aluno se relaciona com esse mundo: "viveu" | "atendeu" | "conhece" | "convive" | "interesse" (interesse = só GOSTARIA de atender, nunca viveu/atendeu).
  · "problemas" = lista de problemas REALMENTE observados/relatados ali, cada um {"publico": subgrupo específico afetado, "problema": a dor observada, "raw": palavras literais}. Dois públicos/problemas distintos no MESMO mercado são DOIS itens — nunca junte num só.
  · "motivacao" = por que ele gostaria de atender esse mercado (só quando é interesse). NÃO é problema.
  · "raw" = palavras literais.
  REGRA DURA: NUNCA use "problemas" pra guardar motivação/afinidade. Se é só interesse e ele não citou problema concreto, "problemas" fica VAZIO e o motivo vai em "motivacao". Interesse por um mercado NÃO é dor validada.
- competencias: o que o aluno faz bem. "o_que" = a competência (concreta, nas palavras dele); "exemplo" = o caso concreto que ele contou.
- provas: resultado concreto de um trabalho. "consequencia" = o que melhorou pro cliente (aceita qualitativo: menos alteração, aprovação mais rápida, cliente mais seguro).
- medos: o medo REAL do próprio aluno ligado a nichar/se posicionar (ex: "medo de perder trabalhos se me fechar"). NÃO é a dor do cliente. Se ele disser que não tem, registre "não tem".
- historia: como ele entrou nesse mundo / virada que conecta com o trabalho de hoje.
- preferencias: {ama:[], odeia:[]} — o que gosta e o que dá preguiça.

## CAPTURE A RESPOSTA INTEIRA (regra dura)
Se numa resposta só o aluno já traz competência + exemplo + resultado, PREENCHA TUDO de uma vez — nunca deixe "exemplo" nem a prova vazios quando ele já contou o caso.
Ex: "fiz o redesign de um site, identifiquei vários problemas e ele converteu 10% mais" →
  "competencias":[{"o_que":"redesign de site / identificar problemas","exemplo":"redesign de um site identificando vários problemas","raw":"fiz o redesign de um site, identifiquei vários problemas"}]
  "provas":[{"consequencia":"converteu 10% mais","raw":"converteu 10% mais"}]

## COMUNIDADES — separe problema de afinidade, e não junte públicos (regra dura)
Ex real: "no mercado de tatuagem, donos de estúdio sabem tatuar mas não sabem gerir o negócio; e tatuadores bons tecnicamente mas pouco conhecidos não conseguem lotar a agenda. Já skate eu só gostaria de trabalhar." →
  "comunidades":[
    {"nome":"tatuagem","relacao":"conhece","problemas":[
        {"publico":"donos de estúdio","problema":"sabem tatuar mas não sabem gerir o negócio","raw":"donos de estúdio sabem tatuar mas não sabem gerir o negócio"},
        {"publico":"tatuadores bons mas pouco conhecidos","problema":"não conseguem lotar a agenda","raw":"tatuadores bons tecnicamente mas pouco conhecidos não conseguem lotar a agenda"}
    ],"raw":"mercado de tatuagem"},
    {"nome":"skate","relacao":"interesse","problemas":[],"motivacao":"gostaria de trabalhar","raw":"skate eu só gostaria de trabalhar"}
  ]
NUNCA invente dor no skate ("vender mais", "comunicação ruim") — problemas fica VAZIO. NUNCA funda os dois problemas da tatuagem num só.

## NORMALIZAR, NÃO REINTERPRETAR (regra dura)
O que você salva tem que ser FIEL ao que o aluno disse. Preserve as palavras e o sentido dele. Pode limpar repetição — NÃO pode criar método, nome, resultado ou "consultorês" que ele não falou.
Aluno: "Meus layouts costumam ser aprovados rápido." → OK: "Aprovação rápida dos layouts." → PROIBIDO: "Entregas de design mais objetivas e estratégicas."
NUNCA vire "fiz o redesign de um site que converteu mais" em rótulo tipo "interfaces web de alta conversão". São as palavras DELE, não uma etiqueta tua.
Em cada item de lista, "raw" guarda as palavras LITERAIS do aluno.

## SAÍDA — responda SOMENTE um JSON, nada fora dele:
{
 "ack": "reação curtíssima ao que ele disse — no MÁXIMO 1 frase, SEM pergunta, SEM '?'. Pode ser \\"\\" se não couber nada honesto.",
 "delta": {
   "comunidades": [{"nome":"","relacao":"viveu|atendeu|conhece|convive|interesse","problemas":[{"publico":"","problema":"","raw":""}],"motivacao":"","raw":""}],
   "competencias": [{"o_que":"","exemplo":"","raw":""}],
   "provas": [{"situacao":"","acao":"","consequencia":"","raw":""}],
   "historia": "",
   "preferencias": {"ama":[],"odeia":[]},
   "medos": ""
 }
}
REGRAS DO DELTA: inclua APENAS o(s) campo(s) que MUDARAM nesta resposta — os que não tocou, NÃO coloque (o servidor preserva o que já existe). Em listas, mande só o item NOVO ou o item ENRIQUECIDO (o servidor mescla por identidade e nunca perde os antigos). Se a resposta não trouxe nada de aproveitável, "delta": {}.`;

// ---------- helpers puros ----------
function arr(x) { return Array.isArray(x) ? x : []; }
function str(x) { return x == null ? '' : String(x); }
function norm(s) { return str(s).toLowerCase().replace(/\s+/g, ' ').trim(); }

// SCHEMA de comunidade: { nome, relacao, problemas:[{publico,problema,raw}], motivacao, raw }
// - problemas: SÓ problemas realmente observados/relatados (nunca afinidade).
// - motivacao: por que gostaria de atender, quando é só interesse (NÃO vira problema).
function normComu(c) {
  c = c || {};
  var problemas = arr(c.problemas).map(function (p) { p = p || {}; return { publico: str(p.publico), problema: str(p.problema), raw: str(p.raw) }; })
    .filter(function (p) { return p.publico || p.problema || p.raw; });
  // migração do schema antigo (problema string único) → primeiro item de problemas[]
  if (!problemas.length && str(c.problema).trim()) problemas = [{ publico: '', problema: str(c.problema), raw: str(c.problema) }];
  // migração do schema antigo (como_conhece) → relacao, quando dá pra inferir
  var relacao = str(c.relacao);
  if (!relacao && str(c.como_conhece).trim()) {
    var cc = norm(c.como_conhece);
    if (/interesse|gostaria|quero|queria/.test(cc)) relacao = 'interesse';
    else if (/atend/.test(cc)) relacao = 'atendeu';
    else if (/viv|trabalh|fui|dono|trampo|famíl|famil/.test(cc)) relacao = 'viveu';
    else relacao = 'conhece';
  }
  return { nome: str(c.nome), relacao: relacao, problemas: problemas, motivacao: str(c.motivacao), raw: str(c.raw) };
}

export function normalizeVoce(v) {
  v = v || {};
  var pref = v.preferencias || {};
  return {
    comunidades: arr(v.comunidades).map(normComu),
    competencias: arr(v.competencias),
    provas: arr(v.provas),
    historia: str(v.historia),
    preferencias: { ama: arr(pref.ama), odeia: arr(pref.odeia) },
    medos: str(v.medos)
  };
}

// sintetiza os campos legados que Canvas/Estrategista/gateForBlock(0) já consomem — determinístico
export function withLegacy(v) {
  var comu = v.comunidades.map(function (c) { return str(c && c.nome).trim(); }).filter(Boolean).join('; ');
  var forte = '';
  if (v.provas[0]) forte = 'prova: ' + [v.provas[0].situacao, v.provas[0].acao, v.provas[0].consequencia].map(str).filter(function (s) { return s.trim(); }).join(' → ');
  else if (v.competencias[0]) forte = 'competência: ' + [v.competencias[0].o_que, v.competencias[0].exemplo].map(str).filter(function (s) { return s.trim(); }).join(' — ');
  return Object.assign({}, v, { mundos: comu, forte: forte, turmas: comu, historia: v.historia });
}

// ---------- merge de comunidades (schema aninhado: problemas[] + relacao + motivacao) ----------
function enrichComu(t, d) {
  if (d.relacao) t.relacao = d.relacao;
  if (d.motivacao) t.motivacao = d.motivacao;
  if (d.raw && !t.raw) t.raw = d.raw;
  d.problemas.forEach(function (np) {
    if (!str(np.problema).trim() && !str(np.publico).trim()) return;
    // identidade por publico + problema (dois públicos/problemas distintos no mesmo mercado convivem, não fundem)
    var pid = norm(np.publico) + '|' + norm(np.problema);
    var ex = t.problemas.find(function (x) { return (norm(x.publico) + '|' + norm(x.problema)) === pid; });
    if (ex) { if (!ex.publico) ex.publico = np.publico; if (!ex.problema) ex.problema = np.problema; if (!ex.raw) ex.raw = np.raw; }
    else t.problemas.push(np); // problema NOVO
  });
}
function mergeComuArr(prevArr, deltaArr) {
  var out = arr(prevArr).map(normComu);
  arr(deltaArr).forEach(function (item) {
    if (!item || typeof item !== 'object') return;
    var d = normComu(item);
    var id = d.nome.trim().toLowerCase();
    if (!id) {
      if (!d.problemas.length && !d.motivacao && !d.relacao) return;      // vazio
      if (out.length) { enrichComu(out[out.length - 1], d); return; }      // sem nome → enriquece a última (mercado atual)
      if (d.problemas.length) out.push(d);                                  // sem base: só cria se tiver problema real
      return;
    }
    var idx = out.findIndex(function (p) { return p.nome.trim().toLowerCase() === id; });
    if (idx >= 0) enrichComu(out[idx], d);
    else out.push(d);
  });
  return out;
}

// ---------- merge por DELTA (nunca perde o que já tinha; mescla por identidade) ----------
function mergeArr(prevArr, deltaArr, key) {
  var out = arr(prevArr).slice();
  arr(deltaArr).forEach(function (item) {
    if (!item || typeof item !== 'object') return;
    if (!Object.keys(item).some(function (k) { return str(item[k]).trim(); })) return; // ignora item vazio
    var id = String(item[key] || '').trim().toLowerCase();
    var idx = id ? out.findIndex(function (p) { return String(p[key] || '').trim().toLowerCase() === id; }) : -1;
    if (idx >= 0) out[idx] = Object.assign({}, out[idx], item); // enriquece o existente
    else out.push(item);                                        // item novo
  });
  return out;
}
export function mergeDelta(prev, delta) {
  prev = normalizeVoce(prev);
  if (!delta || typeof delta !== 'object') return withLegacy(prev);
  var out = { comunidades: prev.comunidades, competencias: prev.competencias, provas: prev.provas, historia: prev.historia, preferencias: prev.preferencias, medos: prev.medos };
  if (delta.comunidades != null) out.comunidades = mergeComuArr(prev.comunidades, delta.comunidades);
  if (delta.competencias != null) out.competencias = mergeArr(prev.competencias, delta.competencias, 'o_que');
  if (delta.provas != null) out.provas = mergeArr(prev.provas, delta.provas, 'consequencia');
  if (typeof delta.historia === 'string' && delta.historia.trim()) out.historia = delta.historia;
  if (typeof delta.medos === 'string' && delta.medos.trim()) out.medos = delta.medos;
  if (delta.preferencias && typeof delta.preferencias === 'object') {
    out.preferencias = { ama: arr(delta.preferencias.ama).length ? arr(delta.preferencias.ama) : prev.preferencias.ama, odeia: arr(delta.preferencias.odeia).length ? arr(delta.preferencias.odeia) : prev.preferencias.odeia };
  }
  return withLegacy(normalizeVoce(out));
}

// ---------- CÉREBRO: decisão determinística da próxima área/gap ----------
function has(a, f) { return arr(a).some(function (x) { return x && String((f ? x[f] : x) || '').trim(); }); }

// relação do aluno com o mercado: 'interesse' = só quer atender (aprofunda com MOTIVAÇÃO, não com problema)
function isInteresse(c) { return /interesse|gostaria|quero/i.test(str(c && c.relacao)); }
function comuSemProblema(c) { return !arr(c && c.problemas).some(function (p) { return p && str(p.problema).trim(); }); }
function comuSemMotiv(c) { return !str(c && c.motivacao).trim(); }
// o que falta aprofundar nesta comunidade: 'problema' (experiência) | 'motivacao' (interesse) | ''
function deepenGap(c) {
  if (isInteresse(c)) return comuSemMotiv(c) ? 'motivacao' : '';
  return comuSemProblema(c) ? 'problema' : '';
}
function comuNeedProblema(v) { return arr(v.comunidades).find(function (c) { return c && str(c.nome).trim() && !isInteresse(c) && comuSemProblema(c); }); }
function comuNeedMotiv(v) { return arr(v.comunidades).find(function (c) { return c && str(c.nome).trim() && isInteresse(c) && comuSemMotiv(c); }); }

export function suficiente(v) {
  v = normalizeVoce(v);
  var essComunidade = has(v.comunidades, 'nome');
  var essCompetencia = has(v.competencias, 'o_que');
  var essProva = has(v.provas, 'consequencia') || arr(v.competencias).some(function (c) { return c && String(c.exemplo || '').trim(); });
  var essMedos = !!String(v.medos || '').trim();
  return !!(essComunidade && essCompetencia && essProva && essMedos); // História/Preferências são complementares (não travam)
}

function mk(area, gap, v, skip) {
  return {
    area: area, gap: gap,
    pode_pular: (area === 'historia' || area === 'preferencias'),
    pode_encerrar: suficiente(v),
    fechado: gap === 'fechamento'
  };
}
// ORDEM: comunidades → competências(identificar→exemplo, com prova junto) → medos → [história] → [preferências] → fechamento
export function decide(v, skip) {
  v = normalizeVoce(v); skip = skip || {};
  var comu = arr(v.comunidades).filter(function (c) { return c && str(c.nome).trim(); });
  var comp = arr(v.competencias);

  if (comu.length === 0) return mk('comunidades', 'comunidade_1', v, skip);
  // 1ª comunidade: aprofunda conforme a relação — experiência pede PROBLEMA, interesse pede MOTIVAÇÃO.
  var d0 = deepenGap(comu[0]);
  if (d0 === 'problema') return mk('comunidades', 'comunidade_problema', v, skip);
  if (d0 === 'motivacao') return mk('comunidades', 'comunidade_motivacao', v, skip);
  if (comu.length < 2) return mk('comunidades', 'comunidade_2', v, skip);
  // 2ª comunidade: mesmo critério.
  var d1 = deepenGap(comu[1]);
  if (d1 === 'problema') return mk('comunidades', 'comunidade_problema', v, skip);
  if (d1 === 'motivacao') return mk('comunidades', 'comunidade_motivacao', v, skip);

  if (!has(v.competencias, 'o_que')) return mk('competencias', 'comp_identificar', v, skip);
  // exemplo e resultado são DOIS micro-passos curtos (mas se já vierem juntos, pula ambos).
  var temExemplo = comp.some(function (c) { return c && str(c.exemplo).trim(); }) || has(v.provas, 'consequencia') || has(v.provas, 'situacao');
  if (!temExemplo) return mk('competencias', 'comp_exemplo', v, skip);
  if (!has(v.provas, 'consequencia')) return mk('competencias', 'comp_resultado', v, skip);

  if (!str(v.medos).trim()) return mk('medos', 'medos', v, skip);

  if (!str(v.historia).trim() && !skip.historia) return mk('historia', 'historia', v, skip);
  if (!(v.preferencias.ama.length || v.preferencias.odeia.length) && !skip.preferencias) return mk('preferencias', 'preferencias', v, skip);
  return mk('fechamento', 'fechamento', v, skip);
}
// mantido por compatibilidade (nada externo usa, mas exportado)
export function gapHint(v) { return decide(v, (v && v._skip) ? (v._skip.reduce(function (o, k) { o[k] = 1; return o; }, {})) : {}).gap; }

// ---------- PERGUNTAS: templates contextuais (usam as palavras do aluno) ----------
function compSemExemplo(v) { var c = arr(v.competencias).find(function (x) { return x && str(x.o_que).trim() && !str(x.exemplo).trim(); }); return c ? str(c.o_que).trim() : ''; }

function questionFor(gap, v) {
  switch (gap) {
    case 'comunidade_1':
      return 'Me diz um mercado, comunidade ou tipo de cliente que você conhece por experiência — porque viveu nesse meio, já atendeu ou convive de perto.';
    case 'comunidade_problema': {
      var cp = comuNeedProblema(v); var n = cp ? str(cp.nome).trim() : '';
      return 'Que problema você mais percebia ' + (n ? ('em ' + n) : 'nesse mercado') + '?';
    }
    case 'comunidade_2':
      return 'Me diz outro mercado, comunidade ou tipo de cliente que você conhece ou gostaria de atender.';
    case 'comunidade_motivacao': {
      var cm = comuNeedMotiv(v); var n2 = cm ? str(cm.nome).trim() : '';
      return 'O que te atrai em trabalhar com ' + (n2 ? n2 : 'esse mercado') + '?';
    }
    case 'comp_identificar':
      return 'Agora sobre você: qual parte do teu trabalho costuma sair bem na tua mão? Pode ser organizar um site confuso, entender rápido o cliente, apresentar uma direção que ele aprova…';
    case 'comp_exemplo':
      return 'Me dá um exemplo rápido de quando isso fez diferença.';
    case 'comp_resultado':
      return 'E o que melhorou por causa disso?';
    case 'medos':
      return 'Falta entender o que pode te travar nessa escolha. O que mais te dá medo quando você pensa em escolher um nicho e se posicionar de forma mais específica?';
    case 'historia':
      return 'Como você entrou nesse mundo? Conta rapidinho de onde vem tua história com design.';
    case 'preferencias':
      return 'O que você mais gosta de fazer no trabalho — e o que te dá preguiça? Manda os dois.';
    default:
      return '';
  }
}
function closingLine() {
  return 'É isso — já dá uma base boa de matéria-prima pra montar teu posicionamento. Dá pra voltar e completar quando quiser.';
}
function sanitizeAck(ack) {
  ack = str(ack).replace(/\s+/g, ' ').trim();
  if (!ack) return '';
  if (ack.indexOf('?') >= 0) ack = ack.split('?')[0].trim();       // ack nunca faz pergunta
  if (ack.length > 140) ack = ack.slice(0, 140).trim();
  if (ack.length < 3) return '';
  if (!/[.!…]$/.test(ack)) ack += '.';
  return ack;
}

// ---------- parse à prova de bala ----------
function tryObj(s) {
  try { return JSON.parse(s); } catch (e) {}
  try { return JSON.parse(s.replace(/,\s*([}\]])/g, '$1')); } catch (e) {}
  return null;
}
function parseLoose(out) {
  var s = String(out || '').replace(/```json/gi, '').replace(/```/g, '').trim();
  var d = extractJSON(s) || tryObj(s);
  if (d) return d;
  var a = s.indexOf('{'), b = s.lastIndexOf('}');
  if (a >= 0 && b > a) { d = tryObj(s.slice(a, b + 1)); if (d) return d; }
  return null;
}

async function askAI(m, tokens, temp) { try { return await ai(MODEL_FAST(), m, tokens, temp); } catch (e) { return ''; } }

// UMA chamada de IA: só extrai o delta (+ ack). Output pequeno = pouco risco de truncar.
async function extractAI(voce, history, askArea) {
  if (!history.length) return { delta: {}, ack: '' };
  var sys = SYSTEM
    + '\n\n## ESTADO ATUAL (já captado — devolve só o DELTA do que MUDOU):\n' + JSON.stringify(voce)
    + '\n## A ÚLTIMA PERGUNTA MIRAVA A ÁREA: "' + askArea + '". Encaixe a resposta principalmente aí, mas capte qualquer outra coisa que aparecer.';
  var msgs = [{ role: 'system', content: sys }];
  history.forEach(function (m) { if (m && m.role && m.content) msgs.push({ role: m.role === 'assistant' ? 'assistant' : 'user', content: str(m.content) }); });
  var data = parseLoose(await askAI(msgs, 2048, 0.3));
  if (!data || (data.delta == null && data.ack == null)) {
    var msgs2 = msgs.concat([{ role: 'user', content: 'Devolva AGORA só o JSON com "ack" e "delta". Nada fora do JSON.' }]);
    data = parseLoose(await askAI(msgs2, 2048, 0.2)) || {};
  }
  return { delta: (data && data.delta) || {}, ack: str(data && data.ack) };
}

function lastAssistant(history) {
  for (var i = arr(history).length - 1; i >= 0; i--) { if (history[i] && history[i].role === 'assistant') return str(history[i].content); }
  return '';
}
function lastUser(history) {
  for (var i = arr(history).length - 1; i >= 0; i--) { if (history[i] && history[i].role === 'user') return str(history[i].content); }
  return '';
}

// monta a devolução (decisão + pergunta) a partir do estado já mesclado
function build(voce, skip, ack, repeatGuardLast) {
  var D = decide(voce, skip);
  var reply;
  if (D.fechado) {
    reply = closingLine();
  } else {
    var q = questionFor(D.gap, voce);
    var a = sanitizeAck(ack);
    // se NÃO captou nada e íamos repetir a MESMA pergunta, avisa que não pegou (evita loop idêntico)
    if (repeatGuardLast && norm(q) === norm(repeatGuardLast)) reply = 'Não peguei bem — me responde em uma frase: ' + q;
    else reply = (a ? a + ' ' : '') + q;
  }
  var out = withLegacy(voce);
  out._skip = Object.keys(skip);
  // ESTADO (contrato): 'coletando' enquanto falta obrigatório · 'base_pronta' quando os 4 obrigatórios entraram.
  // 'concluido' NÃO existe aqui — quem conclui é o ALUNO no clique (o servidor NUNCA manda done=true).
  return {
    reply: reply,
    voce: out,
    area_atual: D.area,
    proximo_gap: D.gap,
    pode_pular: D.pode_pular,        // só nos complementares (história/preferências)
    pode_encerrar: D.pode_encerrar,  // 4 obrigatórios ok → aluno JÁ pode seguir, mesmo com complementar vazio
    base_pronta: D.pode_encerrar,
    estado: D.pode_encerrar ? 'base_pronta' : 'coletando',
    fechado: D.fechado,              // nada mais a perguntar (obrigatórios ok + complementares preenchidos ou pulados)
    done: false,
    suficiente: D.pode_encerrar
  };
}

// lógica de UM turno (o servidor decide tudo; a IA só extrai)
export async function escavadorTurn(body) {
  var raw = (body && body.voce) || {};
  var skip = {}; arr(raw._skip).forEach(function (k) { skip[k] = 1; });
  var voceBefore = normalizeVoce(raw);
  var history = arr(body && body.history).slice(-8);
  var skipField = body && body.skip;

  // AÇÃO DE PULAR (complementar) — sem IA, só recomputa e devolve a próxima
  if (skipField === 'historia' || skipField === 'preferencias') {
    skip[skipField] = 1;
    return build(voceBefore, skip, '', null);
  }

  // TURNO NORMAL — extrai o que o aluno disse e recomputa o fluxo
  var askArea = decide(voceBefore, skip).area;
  var ex = await extractAI(voceBefore, history, askArea);
  var merged = mergeDelta(voceBefore, ex.delta);

  // ANTI-REASK: se JÁ pedimos exemplo/resultado e o aluno respondeu, mas a extração não preencheu,
  // conta a resposta crua e SEGUE — nunca pede a mesma coisa duas vezes.
  var forced = false;
  var mn = normalizeVoce(merged);
  var g0 = decide(mn, skip).gap;
  var la = lastAssistant(history), lu = lastUser(history);
  if (g0 === 'comp_exemplo' && lu && /exemplo|fez diferen/i.test(la)) {
    var alvo = mn.competencias.find(function (c) { return c && str(c.o_que).trim() && !str(c.exemplo).trim(); });
    if (alvo) { alvo.exemplo = lu; merged = withLegacy(mn); forced = true; }
  } else if (g0 === 'comp_resultado' && lu && /melhorou|resultado/i.test(la)) {
    mn.provas = arr(mn.provas).concat([{ consequencia: lu, raw: lu }]);
    merged = withLegacy(mn); forced = true;
  } else if (g0 === 'comunidade_problema' && lu && /problema|resolvia/i.test(la)) {
    var cp2 = comuNeedProblema(mn);
    if (cp2) { cp2.problemas.push({ publico: '', problema: lu, raw: lu }); merged = withLegacy(mn); forced = true; }
  } else if (g0 === 'comunidade_motivacao' && lu && /cativa|te atrai|te interessa|trabalhar com/i.test(la)) {
    var cm2 = comuNeedMotiv(mn);
    if (cm2) { cm2.motivacao = lu; merged = withLegacy(mn); forced = true; }
  }

  var mudou = forced || JSON.stringify(normalizeVoce(merged)) !== JSON.stringify(normalizeVoce(voceBefore));
  return build(merged, skip, ex.ack, mudou ? null : lastAssistant(history));
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const user = await getUser(req);
  if (!user) return res.status(401).json({ error: 'Faça login.' });
  if (!(await aiRateOk(user.id))) return res.status(429).json({ error: 'Você bateu o limite de uso da IA por hoje. Tenta amanhã ou fala com o suporte.' });

  let body = req.body; if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = {}; } }
  try {
    const data = await escavadorTurn(body || {});
    return res.status(200).json({ ok: true, data });
  } catch (e) {
    return res.status(500).json({ error: String(e.message || e) });
  }
}
