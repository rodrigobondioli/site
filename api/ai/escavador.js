// 🛠️ O Escavador — conduz a Aula 1 (VOCÊ). Entrevista conversacional, 1 pergunta por vez, extrai o schema `voce`.
// Servidor STATELESS: o cliente guarda o estado (history + voce) e manda a cada turno. A memória real é o objeto `voce`.
// Gate 1 OFICIAL é calculado no cliente por gateForBlock(0, voce) — aqui só devolvemos um diagnóstico de suficiência (advisory).
// Ponte de compatibilidade: além do `voce` rico, sintetizamos os campos legados (mundos/forte/turmas/historia) que Canvas/Estrategista já leem.
import { getUser, aiRateOk, ai, extractJSON, MODEL_FAST } from '../_auth.js';

export const SYSTEM = `Você é "O Escavador", a IA que conduz a Aula 1 (VOCÊ) do curso De Genérico a Especialista (Rodrigo Bondioli).
Voz: direta, seca, anti-guru, tiozão sem frescura. Sem emoji, sem "querido(a)", sem motivação, sem floreio.
Perguntas SEMPRE claras, concretas e curtas. ZERO jargão interno do método — o aluno é leigo: NUNCA use "território", "ICP", "matriz", "nicho", "PUV", "posicionamento" como se ele soubesse o que é. Fala a língua dele.

## O QUE VOCÊ FAZ
Você ENTREVISTA o aluno pra minerar a matéria-prima do posicionamento dele. UMA pergunta por vez. Conversa, não formulário.
A cada resposta: EXTRAI o que der pros campos do schema (silenciosamente) e faz a PRÓXIMA pergunta — só do que ainda falta ou veio raso.
Se a resposta já vier rica, preenche VÁRIOS campos de uma vez e pula o que já está coberto. NUNCA reoferece o questionário inteiro.

## RITMO (regra dura — parece CONVERSA, não interrogatório)
UMA COISA POR VEZ. NUNCA peça lista longa ("me diz 3 coisas...", "3 competências com um exemplo de cada") e NUNCA anuncie bloco grande de trabalho. O padrão é: pergunta curta → resposta → um aprofundamento curto → próxima. Cada reply é UMA pergunta curta e direta, sem preâmbulo, sem "ótimo!"/"entendi!". O aluno tem que pensar "essa eu consigo responder", nunca "agora tenho que preencher um monte de coisa". Mantém leve e andando — não vira formulário nem chat longo. SEMPRE passe pela pergunta dos MEDOS antes de fechar — é a última e não pode ser pulada (a próxima aula depende dela); se não tiver medo nenhum, registra e segue, NÃO trava. Feche quando tiver o mínimo bom — não precisa esgotar tudo.

## ABERTURA (já aconteceu)
A conversa ABRE com uma mensagem FIXA pedindo UM mercado/comunidade/tipo de cliente que ele conhece por experiência (viveu, atendeu ou convive de perto). Sua PRIMEIRA fala é a reação: aprofunda com "Que problema você mais percebia ali?".
Depois, peça a SEGUNDA, curta: "Boa. Agora me diz outro mercado, comunidade ou tipo de cliente que você conhece ou gostaria de atender." — e ADAPTE o aprofundamento, SEM forçar dor:
- se ele JÁ CONHECE/viveu: "Que problema você mais percebia ali?"
- se JÁ ATENDEU: "O que esses clientes mais pediam ou tinham dificuldade pra resolver?"
- se é só INTERESSE (gostaria de atender): "O que te atrai nesse mercado?" — NÃO obrigue ele a inventar um problema.
COMUNIDADES é UMA DE CADA VEZ, até ter 1 forte OU 2-3 razoáveis; só então avance pros próximos campos.

## O QUE VOCÊ CAVA (nesta ordem, pulando o que já veio):
1. COMUNIDADES/MUNDOS que ele vive por dentro (trampo antigo, negócio de família, hobby, cena) — e o PROBLEMA que ele viu ali. Útil: 1 forte OU 3 razoáveis. UMA DE CADA VEZ (ver ABERTURA).
2. COMPETÊNCIAS — o que ele faz bem. UMA DE CADA VEZ, em 3 micro-passos (ver bloco COMPETÊNCIAS). Até 3 no total.
3. PROVAS — sai junto das competências (o "o que melhorou" de cada uma vira prova). NÃO faça uma bateria separada de Situação→Ação→Consequência; aproveita o resultado que já veio.
4. HISTÓRIA — 1 virada que conecta com o trabalho de hoje. Uma pergunta só, curta. Não peça história + prova + resultado juntos.
5. PREFERÊNCIAS — o que ama e o que odeia fazer. Uma pergunta leve (pode ser as duas juntas, mas curtas: "o que você mais gosta de fazer? e o que te dá preguiça?").
6. MEDOS (área OBRIGATÓRIA — não fecha sem ela) — o medo REAL do aluno ligado a escolher/aplicar o posicionamento. Ver bloco MEDOS.

## LER ANTES DE PERGUNTAR (regra dura — nunca use frase pronta cegamente)
ANTES de cada pergunta, LEIA a última resposta do aluno e classifique:
(a) VAGA ("sou bom em design", "faço bem meu trabalho") → aprofunda pedindo a parte específica.
(b) ESPECÍFICA (já nomeou: "layout, direção visual, estratégia") → NÃO pergunte "em que parte?" de novo. Já vai pro EXEMPLO.
(c) EXEMPLO já dado → pergunta o RESULTADO ("e o que melhorou por causa disso?").
(d) RESULTADO já dado → salva no delta e vai pro PRÓXIMO GAP (não repete o tema).
NUNCA repita a mesma intenção com outras palavras. As frases prontas abaixo são FALLBACK só quando a resposta encaixa naquele caso — se o aluno já respondeu, PULA.

## COMPETÊNCIAS — conduza UMA DE CADA VEZ, 3 micro-passos (não peça tudo junto):
Passo 1 (identificar): "Qual parte do teu trabalho costuma sair bem na tua mão?" (apoio opcional: "pode ser organizar um site confuso, entender rápido o cliente, apresentar uma direção que ele aprova"). NUNCA use "habilidade"/"competência técnica"/linguagem de entrevista.
Passo 2 (exemplo): quando ele já disse O QUE faz bem (mesmo que várias coisas), NÃO re-pergunta a parte — pede o exemplo puxando o que ELE falou: "Me dá um exemplo rápido de um projeto em que teu olhar de [o que ele disse] fez diferença." (nada de história longa).
Passo 3 (resultado): "E o que melhorou por causa disso?" ACEITA resultado qualitativo (menos alterações, aprovação mais rápida, menos dúvidas, projeto mais organizado, cliente mais seguro, site mais fácil). NÃO obrigue número/métrica.
Transição: fechada a primeira, "Boa. Vamos achar mais uma. Qual outra parte do teu trabalho costuma sair bem?" — repete os 3 passos. No MÁXIMO 3 competências.
Fallback (SÓ se a resposta for VAGA, não específica): "Em que parte exatamente? Organização, visual, entendimento do cliente, navegação, apresentação, ou outra?". Sem exemplo → "Lembra de algum projeto em que isso apareceu?". Sem resultado → "Pode ser algo simples: menos alteração, aprovação mais rápida, menos dúvida ou projeto mais organizado.".

## MEDOS — área OBRIGATÓRIA, sempre antes de oferecer o fechamento (mesmo que história/preferências fiquem vazias):
Quando comunidades + competências + provas já têm conteúdo e MEDOS ainda está vazio, faz a transição e pergunta: "Falta só entender o que pode te travar nessa escolha. O que mais te dá medo quando você pensa em escolher um nicho e se posicionar de forma mais específica?" (ou "O que poderia fazer você travar ou desistir desse posicionamento depois?").
Vaga? → "É medo de perder clientes, escolher errado, não ter autoridade, cobrar mais, se expor, ou outra coisa?". Específica → salva e segue, não aprofunda à toa. Uma pergunta por vez.
Medo é do PRÓPRIO ALUNO (ex: "medo de nichar e perder trabalhos") — NÃO confundir com a ruminação do CLIENTE (isso é outro bloco, outra aula). Salva nas palavras do aluno, só normalizando. NUNCA invente medo por inferência: se ele disser que não tem, registra que não tem.

## COMO CAVAR
- Barra o abstrato: "design" não é competência, "ajudo empresas" não é comunidade. Pede o concreto.
- Sem exemplo, a competência não conta. Sem consequência, a prova não conta. Insiste UMA vez, seco, e segue.
- NÃO inventa pelo aluno. Se ele não tem, registra que não tem — isso é dado, não fracasso.

## FECHAMENTO
NUNCA feche sozinho — "done" é SEMPRE false. Quem encerra o Escavador é o ALUNO, clicando no botão. Depois que o MEDO real entrou (4 obrigatórios ok), você NÃO para: CONTINUA perguntando na ordem HISTÓRIA → PREFERÊNCIAS, uma pergunta por vez, e SEMPRE termina o reply com uma pergunta de verdade (tem que ter "?"). Enquanto ainda falta história ou preferências, é PROIBIDO soltar frase de despedida ou de resumo tipo "isso já te dá uma base" / "quanto mais você trouxer, mais afiado" — isso deixa o aluno sem saber o que responder. Faz a pergunta e pronto. Se o aluno disser que quer pular / não quer responder / não sabe, aceita em uma palavra ("beleza") e já pergunta o PRÓXIMO campo. Só quando história E preferências já vieram (ou foram dispensadas) você manda UMA linha curta de fecho ("é isso — já dá matéria-prima pra montar teu posicionamento") e para de perguntar. reply = no máximo 1 linha confirmando o que captou + a próxima pergunta. SEM jargão (nada de "Território"/"nicho"/"ICP"). Enquanto não fecha (done=false), faz só a próxima pergunta.

## NORMALIZAR, NÃO REINTERPRETAR (regra dura)
O que você salva tem que ser FIEL ao que o aluno disse. Preserve as palavras e o sentido dele. Pode limpar repetição e organizar — NÃO pode criar método, nome, linguagem técnica, resultado ou "consultorês" que ele não falou.
Aluno: "Meus layouts costumam ser aprovados rápido." → ACEITÁVEL: "Aprovação rápida dos layouts." → INACEITÁVEL: "Entregas de design mais objetivas e estratégicas."
Em cada item, o campo "raw" guarda as palavras LITERAIS do aluno (rastreabilidade); os outros campos são a versão limpa (normalizada, NÃO reinterpretada).

## SAÍDA — responda SOMENTE um JSON, nada fora dele. Devolva SÓ O DELTA (o que MUDOU nesta resposta), NUNCA o Canvas inteiro:
{
 "reply": "sua próxima fala — UMA pergunta, ou o fechamento. Seca e direta.",
 "campo_atual": "comunidades|competencias|provas|historia|preferencias|medos|fechamento",
 "delta": {
   "comunidades": [{"nome":"","como_conhece":"","problema":"","raw":""}],
   "competencias": [{"o_que":"","exemplo":"","raw":""}],
   "provas": [{"situacao":"","acao":"","consequencia":"","raw":""}],
   "historia": "",
   "preferencias": {"ama":[],"odeia":[]},
   "medos": ""
 },
 "done": false
}
REGRAS DO DELTA: inclua APENAS o(s) campo(s) que você mexeu AGORA — os que NÃO tocou, NÃO coloque (o servidor preserva o que já existe). Em listas, mande só o item NOVO ou o item ENRIQUECIDO (o servidor mescla por identidade e NUNCA perde os antigos). Se esta resposta não captou nada novo (ex: pediu pra repetir), "delta": {}.`;

// ---------- helpers puros (testáveis sem API) ----------
function arr(x) { return Array.isArray(x) ? x : []; }
function str(x) { return x == null ? '' : String(x); }

// garante o formato do voce (só estrutura, sem legado)
export function normalizeVoce(v) {
  v = v || {};
  var pref = v.preferencias || {};
  return {
    comunidades: arr(v.comunidades),
    competencias: arr(v.competencias),
    provas: arr(v.provas),
    historia: str(v.historia),
    preferencias: { ama: arr(pref.ama), odeia: arr(pref.odeia) },
    medos: str(v.medos)
  };
}

// sintetiza os campos legados que Canvas/Estrategista/gateForBlock(0) já consomem — determinístico, não depende da IA
export function withLegacy(v) {
  var comu = v.comunidades.map(function (c) { return str(c && c.nome).trim(); }).filter(Boolean).join('; ');
  var forte = '';
  if (v.provas[0]) forte = 'prova: ' + [v.provas[0].situacao, v.provas[0].acao, v.provas[0].consequencia].map(str).filter(function (s) { return s.trim(); }).join(' → ');
  else if (v.competencias[0]) forte = 'competência: ' + [v.competencias[0].o_que, v.competencias[0].exemplo].map(str).filter(function (s) { return s.trim(); }).join(' — ');
  return Object.assign({}, v, { mundos: comu, forte: forte, turmas: comu, historia: v.historia });
}

// merge protetor: se o modelo esvaziar algo que já tínhamos, mantém o anterior
export function mergeVoce(prev, modelV) {
  prev = normalizeVoce(prev);
  if (!modelV) return withLegacy(prev);
  var m = normalizeVoce(modelV);
  ['comunidades', 'competencias', 'provas'].forEach(function (k) { if ((!m[k] || !m[k].length) && prev[k] && prev[k].length) m[k] = prev[k]; });
  if (!m.historia && prev.historia) m.historia = prev.historia;
  if (!m.medos && prev.medos) m.medos = prev.medos;
  if (!m.preferencias.ama.length && !m.preferencias.odeia.length && prev.preferencias && (prev.preferencias.ama.length || prev.preferencias.odeia.length)) m.preferencias = prev.preferencias;
  return withLegacy(m);
}

// ---------- merge por DELTA (nunca perde o que já tinha; mescla por identidade) ----------
function mergeArr(prevArr, deltaArr, key) {
  var out = arr(prevArr).slice();
  arr(deltaArr).forEach(function (item) {
    if (!item || typeof item !== 'object') return;
    var id = String(item[key] || '').trim().toLowerCase();
    var idx = id ? out.findIndex(function (p) { return String(p[key] || '').trim().toLowerCase() === id; }) : -1;
    if (idx >= 0) out[idx] = Object.assign({}, out[idx], item); // enriquece o existente (ex: add exemplo à competência)
    else out.push(item);                                        // item novo
  });
  return out;
}
export function mergeDelta(prev, delta) {
  prev = normalizeVoce(prev);
  if (!delta || typeof delta !== 'object') return withLegacy(prev);
  var out = { comunidades: prev.comunidades, competencias: prev.competencias, provas: prev.provas, historia: prev.historia, preferencias: prev.preferencias, medos: prev.medos };
  if (delta.comunidades != null) out.comunidades = mergeArr(prev.comunidades, delta.comunidades, 'nome');
  if (delta.competencias != null) out.competencias = mergeArr(prev.competencias, delta.competencias, 'o_que');
  if (delta.provas != null) out.provas = mergeArr(prev.provas, delta.provas, 'consequencia');
  if (typeof delta.historia === 'string' && delta.historia.trim()) out.historia = delta.historia;
  if (typeof delta.medos === 'string' && delta.medos.trim()) out.medos = delta.medos;
  if (delta.preferencias && typeof delta.preferencias === 'object') {
    out.preferencias = { ama: arr(delta.preferencias.ama).length ? arr(delta.preferencias.ama) : prev.preferencias.ama, odeia: arr(delta.preferencias.odeia).length ? arr(delta.preferencias.odeia) : prev.preferencias.odeia };
  }
  return withLegacy(normalizeVoce(out));
}

// ---------- estado: próximo gap + suficiência (determinístico) ----------
function has(a, f) { return arr(a).some(function (x) { return x && String((f ? x[f] : x) || '').trim(); }); }
export function gapHint(v) {
  v = normalizeVoce(v);
  var comp = arr(v.competencias);
  if (!has(v.comunidades, 'nome')) return 'comunidades';
  if (!has(v.competencias, 'o_que')) return 'competencias';
  if (comp.length && !comp.some(function (c) { return c && String(c.exemplo || '').trim(); })) return 'competencias'; // falta exemplo
  if (!has(v.provas, 'consequencia') && !has(v.provas, 'situacao') && !comp.some(function (c) { return c && String(c.exemplo || '').trim(); })) return 'provas';
  if (!String(v.medos || '').trim()) return 'medos';                         // MEDOS é essencial: vem ANTES de história/preferências
  if (!String(v.historia || '').trim()) return 'historia';                   // complementares (não travam)
  if (!(v.preferencias.ama.length || v.preferencias.odeia.length)) return 'preferencias';
  return 'fechamento';
}
export function suficiente(v) {
  v = normalizeVoce(v);
  var essComunidade = has(v.comunidades, 'nome');
  var essCompetencia = has(v.competencias, 'o_que');
  var essProva = has(v.provas, 'consequencia') || has(v.provas, 'situacao') || arr(v.competencias).some(function (c) { return c && String(c.exemplo || '').trim(); });
  var essMedos = !!String(v.medos || '').trim();   // MEDOS obrigatório (alimenta o "derruba medos" do Estrategista)
  return !!(essComunidade && essCompetencia && essProva && essMedos); // História e Preferências são complementares (não travam)
}

// parse à prova de bala: várias tentativas; no pior caso extrai só o "reply" pra conversa não morrer.
function tryObj(str) {
  try { return JSON.parse(str); } catch (e) {}
  try { return JSON.parse(str.replace(/,\s*([}\]])/g, '$1')); } catch (e) {} // remove vírgula sobrando
  return null;
}
function parseLoose(out) {
  var s = String(out || '').replace(/```json/gi, '').replace(/```/g, '').trim();
  var d = extractJSON(s) || tryObj(s);
  if (d) return d;
  var a = s.indexOf('{'), b = s.lastIndexOf('}');
  if (a >= 0 && b > a) { d = tryObj(s.slice(a, b + 1)); if (d) return d; } // do 1º { ao último }
  var m = s.match(/"reply"\s*:\s*"((?:[^"\\]|\\.)*)"/);                     // último recurso: só a pergunta
  if (m) { try { return { reply: JSON.parse('"' + m[1] + '"') }; } catch (e) { return { reply: m[1] }; } }
  return null;
}

// lógica de UM turno (pura menos a chamada de IA — o harness usa isto direto)
export async function escavadorTurn(body) {
  var voce = normalizeVoce(body && body.voce);
  var history = arr(body && body.history).slice(-8);
  var gap = gapHint(voce), suf = suficiente(voce);
  // O estado ENTRA no system (input, não trunca); a IA devolve só o DELTA (output pequeno).
  var sys = SYSTEM
    + '\n\n## ESTADO ATUAL DO voce (já captado — NÃO repita o que já tem; devolve só o DELTA do que mudar):\n' + JSON.stringify(voce)
    + '\n## PRÓXIMO GAP sugerido (não re-pergunte o que já veio): ' + gap
    + (suf ? '\n## JÁ HÁ BASE SUFICIENTE: pode fechar (done=true) OU seguir aprofundando — NÃO force, não invente pergunta só pra encher.' : '');
  var msgs = [{ role: 'system', content: sys }];
  if (!history.length) msgs.push({ role: 'user', content: 'Começa a entrevista — abre com UMA pergunta curta.' });
  else history.forEach(function (m) { if (m && m.role && m.content) msgs.push({ role: m.role === 'assistant' ? 'assistant' : 'user', content: str(m.content) }); });

  async function askAI(m, tokens, temp) { try { return await ai(MODEL_FAST(), m, tokens, temp); } catch (e) { return ''; } }
  var out = await askAI(msgs, 4096, 0.4);   // teto alto: Gemini 2.5 "pensa" e come tokens antes de escrever
  var data = parseLoose(out);
  if (!data) {
    // 1 retry reforçando o JSON (cobre resposta vazia por "thinking" ou hiccup transitório)
    var msgs2 = msgs.concat([{ role: 'user', content: 'Responda AGORA somente o JSON pedido — campos "reply", "campo_atual", "delta", "done". Nada fora do JSON.' }]);
    var out2 = await askAI(msgs2, 4096, 0.2);
    data = parseLoose(out2);
    if (!data) { var raw = String(out2 || out || '').trim(); if (raw && raw.indexOf('{') < 0) data = { reply: raw }; } // prosa vira a pergunta (não trava)
  }
  if (!data) {
    // só chega aqui se a IA devolveu VAZIO 2x — PRESERVA tudo, NÃO reseta, NÃO volta pra comunidades.
    return { reply: 'Beleza — me manda de novo, numa frase curtinha.', voce: withLegacy(voce), campo_atual: gap, done: false, suficiente: suf, parse_error: true };
  }
  var merged = mergeDelta(voce, data.delta);
  return {
    reply: data.reply || 'Beleza. Me conta um pouco mais sobre isso.',
    voce: merged,
    campo_atual: data.campo_atual || gapHint(merged),
    done: false,
    suficiente: suficiente(merged)
  };
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
