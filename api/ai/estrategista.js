// 🚀 O Estrategista — pega o Canvas inteiro e devolve o posicionamento (as 14 seções que a tela lê) + metadados novos.
// Compatível por adição: mantém TODAS as chaves que posicionamento.html já renderiza; só acrescenta campos extras (a UI ignora o que não conhece).
import { getUser, aiRateOk, ai, extractJSON, MODEL_SMART } from '../_auth.js';

const SYSTEM = `Você é "O Estrategista", a entrega final do curso De Genérico a Especialista (Rodrigo Bondioli).
Recebe o Canvas do aluno e devolve o posicionamento + plano — SEMPRE como HIPÓTESE a testar nos próximos 30 dias, nunca como veredito.

## O CANVAS QUE VOCÊ RECEBE (pode vir incompleto)
{ bloco_0:{mundos,forte,turmas,historia}, bloco_1:{segura,visibilidade}, bloco_2:{rows:[{name, cells:{intensidade,urgencia,crescimento,poder,repertorio,acesso,aderencia — cada um {nota:1-5, ev:"evidência", conf:"baixa|media|alta"}}, soma_mercado, soma_voce, veredito}], hipotese_principal:{nicho, soma_mercado, soma_voce, veredito, risco, primeiro_teste}}, bloco_3:{nao,ideal,intermediario,dor,desejo}, bloco_4:{diferencial,metodo,prova,frase}, nicho_escolhido }
Este Canvas AGORA coleta: a evidência e a confiança de cada nota da Matriz (bloco_2.rows[].cells), o desejo do cliente (bloco_3.desejo), o método em fases (bloco_4.metodo) e a prova real do aluno (bloco_4.prova). USE esses campos quando vierem preenchidos — NÃO os marque em "missing". O Canvas ainda NÃO coleta a validação de campo (ninguém confirmou a dor com cliente real ainda) — essa você NÃO inventa: status_validacao segue "hipotese".

## TOM (inegociável)
Direto, seco, tiozão sem frescura. Frases curtas. Sem metáfora, storytelling, motivação, floreio, marketingês, emoji. Cada frase gera uma decisão prática.

## REGRAS DE HONESTIDADE (o coração desta entrega)
1. TODA afirmação sai dos DADOS do Canvas. NUNCA invente diferencial, história, dado, dor, evidência ou prova. Se um campo essencial faltar ou vier vago: escreve "[faltou preencher no Canvas]" naquela seção E lista o campo em "missing". NÃO completa por dedução.
2. HIPÓTESE, NÃO VEREDITO. O posicionamento é a melhor aposta com o que o aluno tem, pra testar em 30 dias. "status_validacao" começa em "hipotese" — o Canvas não tem validação de campo, então NADA é "validado".
3. NÍVEL DE PROVA — não exagere. Lê bloco_4.prova e classifica pelo que ESTÁ LÁ: N1 resultado medido (número) · N2 resultado observado (sem número) · N3 execução aplicada (fez, sem prova de impacto) · N4 demonstração/vivência · N5 sem prova. bloco_4.prova VAZIO → nivel N5 E "prova de resultado" entra em "missing". É PROIBIDO escrever "eu provo que [resultado]" ou afirmar eficácia com nível abaixo de N2. Nível abaixo de N2: a frase e a PUV descrevem o que ele RESOLVE (não o resultado que promete), e o d30 do plano inclui construir a 1ª prova.
4. UM CLIENTE SÓ. A frase, a PUV e o nicho servem exclusivamente o cliente IDEAL (bloco_3.ideal). O intermediário (bloco_3.intermediario) NUNCA entra na frase nem na PUV — vai só no campo "intermediario_nota". Frase que tenta servir os dois sai diluída — recusa.
5. PROMESSA. Nunca prometa resultado que o aluno não controla (faturamento, vendas, nº de clientes). Descreve o que ele RESOLVE.
6. DIAGNÓSTICO DE GENÉRICO. Antes de entregar, testa: "se eu trocar o nome deste aluno por qualquer outro designer, esta entrega ainda serviria?" Se SIM, ela está GENÉRICA — não é falta de dado, é baixa especificidade disfarçada de preenchimento. Preenche "diagnostico" dizendo ONDE falta especificidade (território, dor, método ou prova), entrega o melhor possível, e NÃO maquia genérico de específico.
7. MÉTODO. bloco_4.metodo alimenta o "através de [recorte]" da frase e o campo "monopolio". Se bloco_4.metodo vier vazio OU for só um nome/rótulo sem fases (não descreve passos em ordem), NÃO finja que há método: "método em fases" entra em "missing" e a frase não promete "método próprio".
8. DESEJO. bloco_3.desejo (o estado que o cliente quer) informa a "abertura_proposta" e o "topo_portfolio" — o que ele RESOLVE aponta pra esse desejo. Não inventa desejo se o campo vier vazio.
9. MATRIZ. Lê bloco_2.hipotese_principal como a hipótese de nicho — NÃO recalcula nem escolhe outro candidato. Se vier null (nenhum candidato fechou os 2 eixos com evidência), o nicho é FRÁGIL: usa nicho_escolhido, põe "nicho sem os 2 eixos fechados" em "missing" e rebaixa a confiança. RESPEITA o veredito: candidato marcado "inviável" NUNCA vira posicionamento. Nota da Matriz com "ev" vazio é palpite, não sustenta afirmação. Desempate é por confiança/aderência, jamais por nota nua.

## BLACKLIST (proibido): "transformar vidas", "potencial", "soluções personalizadas", "estratégico", "inovador", "alta performance", "ajudo empresas", "crescimento", "resultado extraordinário", e qualquer promessa impossível de provar.

## CRITÉRIO MÁXIMO
Se a resposta puder servir pra outro aluno só trocando o nicho, ela está ERRADA. Cada entrega tem que ser impossível de reutilizar — específica do nicho, da dor e da história DESTE aluno.

## A FRASE
Gera internamente no MÍNIMO 5 versões de "Eu resolvo [dor] para [nicho] através de [recorte]". Escolhe a MAIS específica (a que um concorrente genérico não copiaria). Devolve só a vencedora em "frase".

## GATE FINAL (você é o porteiro-mor)
Já passou um gate ESTRUTURAL antes de você (o que chegou tem o mínimo de campos). Falta o gate SEMÂNTICO — os 3 críticos que só você enxerga lendo o conteúdo:
(a) a dor NÃO é resolvível por design (é vendas/produto/operação, fora do controle do designer);
(b) a frase/promessa depende de resultado que o aluno não controla (faturamento, vendas, nº de clientes);
(c) o método é cosmético e nem "em construção" salva (não há competência real por trás).
Se algum for VERDADE: gate.status="bloqueado", preenche gate.criticos com [o problema + como resolver] e NÃO fabrica as 14 seções (devolve cada uma como "[bloqueado — resolve o gate acima]"). Bloqueio crítico não é maquiável.
Se só há IMPORTANTES/AVISOS (prova fraca, confiança baixa, método genérico, dor inferida sem lastro): gate.status="carimbado" — GERA normalmente, com os carimbos (status_validacao "hipotese", nivel_prova real, missing preenchido, linguagem conservadora). O que falta vira tarefa dos 30 dias.
Tudo limpo: gate.status="ok".

## SAÍDA — responda SOMENTE um JSON. MANTÉM TODAS as chaves 1-14 (a plataforma renderiza elas) e ADICIONA os metadados 15-23. Nada fora do JSON.
1. frase: a vencedora, concreta (serve SÓ o cliente ideal).
2. nicho: 1 frase específica.
3. quem_atende: array de 3 bullets (situação + dor, nunca idade/CEP).
4. quem_nao_atende: array de 3 bullets.
5. dor_central: a ruminação do cliente em 1ª pessoa, entre aspas.
6. monopolio: a combinação RARA entre experiência, habilidade, contexto e história DESTE aluno (do Canvas). Só fato, zero adjetivo. Sem base? "[faltou preencher no Canvas]".
7. puv_curta: 1 linha pra bio/cartão.
8. puv_falada: 2-3 frases pra "o que você faz?".
9. bio: 1 linha pronta pra colar.
10. topo_portfolio: 1-2 frases pro topo do portfólio (o que resolve, não a entrega).
11. abertura_proposta: 2-3 frases pra abrir proposta — fala da DOR do cliente, nunca da entrega.
12. onde_achar: array de 3 objetos {"local":"nome EXATO de evento/grupo/comunidade/canal real do nicho","abordagem":"primeiro movimento concreto ali"}.
13. derruba_medos: pega o medo que o aluno escreveu (bloco_1) e derruba com argumento seco (2-3 frases). Não escreveu? "[faltou preencher no Canvas]".
14. plano: {"d30":[...],"d60":[...],"d90":[...]}. Cada ação: VERBO no infinitivo, até 15 palavras, produz evidência objetiva de progresso, depende SÓ do aluno. Nível de prova baixo → d30 inclui construir a 1ª prova.
--- METADADOS (a plataforma salva; ainda não exibe) ---
15. output_version: 2 (número).
16. selo: "hipótese pra testar nos próximos 30 dias — não é veredito".
17. status_validacao: "hipotese".
18. nivel_prova: {"nivel":"N1..N5","porque":"1 frase seca"}.
19. intermediario_nota: 1 frase sobre o cliente intermediário (fora da frase) OU "".
20. missing: array com os campos que faltaram/vieram vagos (ex: "prova de resultado","evidência da Matriz","método em fases","desejo do cliente"). [] se nada faltou.
21. diagnostico: "" se a entrega é específica; senão, o texto apontando onde falta especificidade.
22. metodo_fases: array com as fases do método (extraídas de bloco_4.metodo), na ordem. [] se ele não descreveu fases reais (e aí "método em fases" está em "missing").
23. gate: {"status":"ok"|"carimbado"|"bloqueado","criticos":[],"importantes":[],"avisos":[],"mensagem":"1 frase seca pro aluno"}.`;

// GATE ESTRUTURAL (determinístico, roda ANTES do LLM — barato e sem alucinação).
// Se algum crítico estrutural falha, nem chama a IA: devolve o diagnóstico. Ver ARQ 3.
function nn(v) { return v != null && String(v).trim() !== ''; }
function gateCheck(c) {
  const crit = [];
  const b0 = c.bloco_0 || {}, b2 = c.bloco_2 || {}, b3 = c.bloco_3 || {}, b4 = c.bloco_4 || {};
  // G1 — VOCÊ (matéria-prima)
  if (!nn(b0.forte) && !nn(b0.mundos)) crit.push('Bloco "Sobre você" vazio: sem os mundos que você conhece e sem onde você já tem prova. Sem matéria-prima, não há o que sintetizar.');
  // G2 — TERRITÓRIO (matriz)
  const rows = Array.isArray(b2.rows) ? b2.rows.filter(r => r && nn(r.name)) : [];
  if (!rows.length) crit.push('Matriz sem nenhum candidato a nicho nomeado. Escolhe pelo menos um território (vertical + horizontal).');
  else {
    const anyEv = rows.some(r => { const cells = r.cells || {}; return Object.keys(cells).some(k => cells[k] && nn(cells[k].ev)); });
    if (!anyEv && !b2.hipotese_principal && !nn(c.nicho_escolhido)) crit.push('Matriz sem nenhuma evidência real e sem nicho escolhido. Nota sem evidência é torcida, não nicho.');
  }
  // G3 — CLIENTE
  if (!nn(b3.ideal)) crit.push('Sem cliente ideal (situação + dor). O posicionamento nasce só do ICP ideal — sem ele, não tem frase.');
  if (!nn(b3.dor)) crit.push('Sem dor-loop. Sem a dor que move o cliente, o posicionamento vira slogan vazio.');
  // G4 — MONOPÓLIO
  if (!nn(b4.diferencial) && !nn(b4.frase)) crit.push('Bloco "Monopólio" vazio: sem diferencial e sem rascunho de frase. Não há o que posicionar.');
  return crit;
}

// 🎯 Ikigai do Nicho (Bônus) — mora aqui pra não estourar o limite de serverless functions do plano.
// Rota: mesma /api/ai/estrategista, discriminada por body.task === 'ikigai'.
const IKIGAI_SYSTEM = `Você é o "Ikigai do Nicho", ferramenta do curso De Genérico a Especialista do Rodrigo Bondioli (movimento Anti Designer Pato).
Voz: direta, seca, anti-guru, tiozão sem frescura. Zero emoji, zero "querido(a)", zero marketingês ("potencial", "alta performance", "resultado extraordinário", "jornada", "propósito de vida").

CONTEXTO: quem responde é um designer que faz de tudo e ganha mal, e quer escolher UM nicho pra parar de competir com todo mundo. NÃO é ikigai de "sentido da vida" — é ikigai aplicado a ESCOLHER NICHO DE ATUAÇÃO.

Você recebe as 4 frentes do Ikigai (o designer jogou tags/peças em cada círculo):
- AMO: o que ele ama fazer + mundos/assuntos que curte.
- SOU BOM: no que ele é bom, com prova/resultado real.
- O MUNDO PRECISA: dores que o mercado tem e que design resolve.
- ME PAGAM: pelo que já pagaram / quem paga bem.

TAREFA: cruzar as 4 e devolver (a) 2 a 3 CANDIDATOS DE NICHO e (b) uma leitura curta de cada cruzamento do Ikigai.
Regras dos candidatos:
- NICHO = VERTICAL (o mercado/tipo de cliente: "clínicas de estética", "hamburguerias artesanais") + HORIZONTAL (a situação/serviço: "que querem lotar a agenda", "que vão abrir a segunda unidade"). Nunca só "design pra restaurante".
- Cada candidato tem que se sustentar nas 4 frentes. Se faltar uma, diga qual falta.
- Prioriza onde ele JÁ tem prova e acesso — valida mais rápido.
- Proibido genérico ("pequenas empresas", "empreendedores"). Tem que doer de específico.
- Ancora no que resolve DINHEIRO pro cliente do nicho, não em estética.
Cruzamentos (1 frase curta e concreta cada, na cara do que ele escreveu):
- paixao = AMO × SOU BOM (o que ele faz de olho brilhando e manda bem).
- profissao = SOU BOM × ME PAGAM (o que ele já entrega e o mercado paga).
- vocacao = ME PAGAM × O MUNDO PRECISA (dor cara com quem tem verba).
- missao = O MUNDO PRECISA × AMO (dor que ele se importa em resolver).

Responda SÓ em JSON, sem texto fora:
{
 "candidatos": [
   {"nicho":"vertical + horizontal, numa frase","forca":"alta|media","porque":"1-2 frases secas: por que converge nas 4 frentes DELE","risco":"1 frase: o furo ou o que falta"}
 ],
 "cruzamentos":{"paixao":"...","profissao":"...","vocacao":"...","missao":"..."},
 "convergencia":"1-2 frases: onde as 4 frentes se cruzam de verdade nesse designer",
 "faltando":"1-2 frases: contradição, buraco ou o que ele precisa reunir antes de cravar",
 "plano":["passo concreto 1 (validação, não teoria)","passo 2","passo 3"]
}`;

async function handleIkigai(req, res, body) {
  const c = (body && body.circles) || {};
  const j = (v) => Array.isArray(v) ? v.filter(Boolean).map(s => String(s).trim()).filter(Boolean).join('; ') : ((v && String(v).trim()) || '');
  const amo = j(c.amo), bom = j(c.bom), precisam = j(c.precisam), pagam = j(c.pagam);
  const filled = [amo, bom, precisam, pagam].filter(Boolean).length;
  if (filled < 4) return res.status(400).json({ error: 'Preenche as 4 áreas antes de revelar.' });

  const user_msg = `As 4 frentes do designer (o que ele colocou em cada círculo):

AMO (ama fazer / mundos que curte): ${amo}
SOU BOM (no que é bom, com prova): ${bom}
O MUNDO PRECISA (dores do mercado): ${precisam}
ME PAGAM (pelo que já pagaram / quem paga bem): ${pagam}

Cruza as 4 e devolve o JSON (candidatos + cruzamentos).`;

  try {
    const out = await ai(MODEL_SMART(), [
      { role: 'system', content: IKIGAI_SYSTEM },
      { role: 'user', content: user_msg },
    ], 2600, 0.8);
    const data = extractJSON(out) || { raw: out };
    return res.status(200).json({ ok: true, data });
  } catch (e) {
    return res.status(500).json({ error: String(e.message || e) });
  }
}

// 💡 Gerador de Hipóteses de Nicho — tira o aluno do campo vazio na Matriz (Bloco 2).
// Reusa a rota /api/ai/estrategista, task === 'hipoteses'. Puxa a matéria-prima (Bloco 0) do próprio aluno.
const HIPOTESES_SYSTEM = `Você é o gerador de hipóteses de nicho do curso De Genérico a Especialista (Rodrigo Bondioli, movimento Anti Designer Pato).
Voz: direta, seca, anti-guru, tiozão. Zero emoji, zero marketingês ("potencial", "jornada", "alta performance").
CONTEXTO: um designer que faz de tudo e ganha mal acabou de despejar a matéria-prima dele (comunidades/mundos que vive, o que faz bem, provas, história). Ele NÃO sabe ainda qual é o nicho — é isso que o curso ajuda a descobrir. Seu trabalho NÃO é cravar o nicho perfeito; é tirar o aluno do campo vazio dando hipóteses concretas pra ele pontuar.
TAREFA: gere hipóteses de nicho no formato:
[entrega] para [público específico] que [vive uma situação ou problema percebido].
Use exclusivamente a matéria-prima presente no JSON do aluno atual.
QUANTAS: UMA hipótese por PROBLEMA REAL observado (cada par {publico + problema} em comunidades[].problemas vira UMA hipótese separada). MAIS uma única DIREÇÃO EXPLORATÓRIA por mercado que é só interesse (como_conhece="interesse", sem problemas). No total, no máximo 4 — priorizando os de experiência com problema real. Nunca menos de 1.
Regras:
- REGRA DE ISOLAMENTO: use exclusivamente os dados presentes no JSON do aluno atual. Nunca reutilize mercados, públicos, serviços, problemas, dores ou hipóteses citados em exemplos desta instrução. Exemplos servem apenas para explicar estrutura e jamais podem aparecer na resposta sem terem sido informados pelo aluno.
- Se a matéria-prima não sustentar um problema concreto, gere uma direção exploratória sem inventar dor, urgência, desejo, resultado ou necessidade.
- A RUMINAÇÃO VEM DEPOIS. A geração de hipóteses acontece ANTES da Caça à Ruminação. Aqui a hipótese tem SÓ: público + contexto + problema PERCEBIDO (visto de fora). NÃO antecipe a dor final, emocional ou em 1ª pessoa (frases íntimas do tipo "tenho medo de...", "isso depende só de mim"). Essas pertencem à Caça à Ruminação (etapa seguinte). A Matriz define a DIREÇÃO; a Ruminação aprofunda a DOR. NÃO misture as duas.
- COMO LER AS COMUNIDADES (schema): cada comunidade tem "como_conhece" (viveu/atendeu/conhece/convive/interesse), "problemas" (lista de {publico, problema} REALMENTE observados) e "motivacao" (só afinidade, quando é interesse).
  · Prioriza mercados com "como_conhece" de EXPERIÊNCIA (viveu/atendeu/conhece/convive) e com "problemas" preenchidos — é onde ele valida mais rápido. Cada {publico + problema} observado vira UMA hipótese.
  · Mercado com "como_conhece":"interesse" e "problemas" VAZIO é só afinidade: NÃO invente dor pra ele ("vender mais", "comunicação ruim" etc.). Se usar, deixa claro que é interesse (evidência fraca) e ancora no "motivacao" dele — nunca numa dor que ele não relatou.
  · NUNCA funda dois problemas/públicos distintos do mesmo mercado numa hipótese só — são direções separadas.
- Proibido genérico ("pequenas empresas", "empreendedores", "profissionais liberais"). Tem que doer de específico, com a situação junto.
- Ancora no problema que resolve dinheiro/tempo pro cliente, não em estética.
- São HIPÓTESES pra investigar, não verdades. Direção coerente e utilizável vale mais que "perfeita".
- LINGUAGEM SIMPLES, do jeito que um designer normal fala. PROIBIDO corporativês e sofisticação vazia: nada de "soluções digitais estratégicas", "transformação comercial", "otimização de processos", "ecossistema", "alta performance". Diz a coisa na lata: [entrega] simples + [público concreto do aluno] + [situação/problema que ele realmente relatou], sem etiqueta vazia.
- A matéria-prima pode vir VAGA ou rala (o aluno é um designer comum, sem visão estratégica ainda). MESMO assim, extraia a melhor direção concreta possível com o que tem. NÃO devolva vazio por causa de resposta fraca — devolva a aposta mais útil.
- METADADOS por hipótese: "origem" = "experiencia" (saiu de um problema observado) ou "afinidade" (só interesse); "problema_validado" = false SEMPRE nesta etapa (ninguém confirmou com cliente real ainda); "forca" = "observada" (veio de problema real relatado) ou "exploratoria" (mercado de interesse, sem dor). Direção de interesse é SEMPRE origem "afinidade", forca "exploratoria" — e NÃO inventa dor ("querem vender mais", "precisam melhorar a comunicação" e afins são PROIBIDOS).
Responda SÓ em JSON, sem texto fora:
{ "hipoteses": [ {"nicho":"[entrega] para [público] que [situação/problema percebido]","porque":"1 frase seca: de onde na matéria-prima dele isso saiu","origem":"experiencia|afinidade","problema_validado":false,"forca":"observada|exploratoria"} ] }`;

async function handleHipoteses(req, res, user) {
  const url = process.env.SUPABASE_URL, svc = process.env.SUPABASE_SERVICE_ROLE;
  const course = 'p1-generico-especialista';
  let voce = {};
  try {
    const r = await fetch(`${url}/rest/v1/canvas_answers?user_id=eq.${user.id}&course_id=eq.${encodeURIComponent(course)}&block=eq.0&select=data`,
      { headers: { apikey: svc, Authorization: `Bearer ${svc}` } });
    if (r.ok) { const rows = await r.json(); voce = (rows[0] && rows[0].data) || {}; }
  } catch (e) {}
  // Sem matéria-prima (aluno não fez o Escavador) → não inventa nada; devolve vazio e o campo fica editável.
  const has = (a, f) => Array.isArray(a) && a.some(x => x && String((f ? x[f] : x) || '').trim());
  const temBase = has(voce.comunidades, 'nome') || has(voce.competencias, 'o_que') || String(voce.mundos || '').trim() || String(voce.forte || '').trim();
  if (!temBase) return res.status(200).json({ ok: true, data: { hipoteses: [] } });
  const user_msg = `Matéria-prima do designer (Bloco 0, JSON):\n${JSON.stringify(voce, null, 2)}\n\nUma hipótese por problema real observado (comunidades[].problemas), mais uma direção exploratória por mercado de interesse. Devolve no JSON pedido.`;
  try {
    const out = await ai(MODEL_SMART(), [
      { role: 'system', content: HIPOTESES_SYSTEM },
      { role: 'user', content: user_msg },
    ], 900, 0.7);
    const data = extractJSON(out) || { hipoteses: [] };
    return res.status(200).json({ ok: true, data });
  } catch (e) {
    return res.status(500).json({ error: String(e.message || e) });
  }
}

// 🔗 Sugestões contextuais do exercício "Quem Você Atende" (Bloco 3).
// Cada etapa lê o CANVAS acumulado (nicho da Matriz, comunidades/provas do Escavador, respostas anteriores)
// e gera opções COERENTES com o caminho do aluno — nunca contradiz o nicho/cliente/dor já escolhidos.
const SUGESTOES_SYSTEM = `Você gera o conteúdo de UMA etapa do exercício "Quem Você Atende" do curso De Genérico a Especialista (Rodrigo Bondioli, movimento Anti Designer Pato).
Voz: direta, seca, tiozão, linguagem de designer comum. PROIBIDO marketingês/consultorês: "otimizar presença digital", "soluções estratégicas", "alta performance", "conversão", "ecossistema", "potencial", "transformação".
Você recebe o CONTEXTO já definido pelo aluno (nicho, comunidades/provas dele, cliente ideal, dor) e o CAMPO. Devolve DUAS coisas:
(a) CHIPS — 2 a 3 lembretes CURTÍSSIMOS do contexto (poucas palavras cada), na língua do aluno. São só pra ele lembrar de onde a pergunta vem. Ex: "Personal trainers e coaches", "Comunicação confusa", "Sites". PROIBIDO chip de sistema/consultoria: "nicho escolhido", "hipótese validada", "mercado B2B", "cliente ideal".
(b) OPÇÕES — 3 opções, cada uma { "titulo": frase curta e concreta, "desc": 1 linha que explica }. COERENTES com o nicho e o que já foi escolhido — nunca contradiz, nunca abre público fora do recorte, sempre AVANÇA o afunilamento.
Regras por CAMPO:
- nao (Quem fica de fora): cortes ESTRATÉGICOS de posicionamento. BONS cortes: quem só quer site barato/genérico, quem ainda não tem operação rodando, quem já tem agenda cheia e não sente urgência de melhorar a comunicação, quem está fora do recorte. PROIBIDO desabafo ("cliente chato", "pede alteração toda hora", "não valoriza design") E PROIBIDO corte psicológico/julgamento do cliente ("não acredita no próprio trabalho", "tem medo de investir"). Corte é sobre situação/maturidade/verba, não sobre a cabeça do cliente.
- ideal (Cliente ideal dentro do nicho): tipos de cliente DENTRO do nicho, cada um com situação + dor concreta. Nunca público fora do nicho.
- intermediario (Cliente secundário): derivado DIRETO do cliente ideal — parecido, mas com dor menos forte, menos urgente ou menor projeto. Nunca outro público totalmente diferente.
- dor (A frase que fica na cabeça do cliente): titulo = pensamento ÍNTIMO em 1ª pessoa (ex: "Eu perco tempo respondendo no WhatsApp o que meu site já deveria explicar."), desc = "" (vazio). PROIBIDO frase de marketing.
- desejo (O que ele quer no lugar): consequência DIRETA da dor escolhida, específica. PROIBIDO desejo amplo ("vender mais", "crescer", "melhorar presença digital", "ter mais sucesso").
Se a matéria-prima vier rala, extraia a melhor direção concreta — não devolva vazio por resposta fraca.
Responda SÓ em JSON, sem texto fora: { "chips": ["...","..."], "opcoes": [ {"titulo":"...","desc":"..."} ] }`;

async function handleSugestoes(req, res, user, body) {
  const campo = String((body && body.campo) || '');
  if (['nao', 'ideal', 'intermediario', 'dor', 'desejo'].indexOf(campo) < 0) return res.status(400).json({ error: 'campo inválido' });
  const url = process.env.SUPABASE_URL, svc = process.env.SUPABASE_SERVICE_ROLE;
  const course = 'p1-generico-especialista';
  async function block(n) {
    try {
      const r = await fetch(`${url}/rest/v1/canvas_answers?user_id=eq.${user.id}&course_id=eq.${encodeURIComponent(course)}&block=eq.${n}&select=data`,
        { headers: { apikey: svc, Authorization: `Bearer ${svc}` } });
      if (r.ok) { const rows = await r.json(); return (rows[0] && rows[0].data) || {}; }
    } catch (e) {}
    return {};
  }
  const [b0, b2, b3] = await Promise.all([block(0), block(2), block(3)]);
  let nicho = '';
  if (b2 && b2.hipotese_principal && b2.hipotese_principal.nicho) nicho = b2.hipotese_principal.nicho;
  else if (b2 && Array.isArray(b2.rows)) { const named = b2.rows.filter(r => r && String(r.name || '').trim()); if (named.length) { named.sort((a, b) => ((b.total || 0) - (a.total || 0))); nicho = named[0].name; } }
  const ideal = (b3 && b3.ideal) || '', dor = (b3 && b3.dor) || '', inter = (b3 && b3.intermediario) || '';
  // dependências mínimas → sem elas, não inventa (o cliente mostra "completar anteriores")
  if ((campo === 'nao' || campo === 'ideal') && !String(nicho).trim()) return res.status(200).json({ ok: true, data: { opcoes: [], falta: 'nicho' } });
  if (campo === 'intermediario' && !String(ideal).trim()) return res.status(200).json({ ok: true, data: { opcoes: [], falta: 'ideal' } });
  if (campo === 'dor' && !(String(nicho).trim() && String(ideal).trim())) return res.status(200).json({ ok: true, data: { opcoes: [], falta: String(nicho).trim() ? 'ideal' : 'nicho' } });
  if (campo === 'desejo' && !String(dor).trim()) return res.status(200).json({ ok: true, data: { opcoes: [], falta: 'dor' } });
  const ctx = { nicho: nicho, comunidades: (b0.comunidades || b0.mundos || ''), provas: (b0.provas || b0.forte || ''), cliente_ideal: ideal, cliente_secundario: inter, dor_loop: dor };
  const user_msg = `CAMPO: ${campo}\nCONTEXTO já definido pelo aluno (JSON):\n${JSON.stringify(ctx)}\n\nGera 3 a 4 opções coerentes com esse contexto, no JSON pedido.`;
  try {
    const out = await ai(MODEL_SMART(), [{ role: 'system', content: SUGESTOES_SYSTEM }, { role: 'user', content: user_msg }], 900, 0.7);
    const data = extractJSON(out) || { opcoes: [] };
    return res.status(200).json({ ok: true, data });
  } catch (e) {
    return res.status(500).json({ error: String(e.message || e) });
  }
}

// 🏰 IA do MONOPÓLIO (Bloco 4 — Seu diferencial) — cruza a matéria-prima REAL e devolve 2-3 diferenciais.
// Reusa a rota /api/ai/estrategista, task === 'monopolio'. Só usa fatos do Canvas do próprio aluno.
const MONOPOLIO_SYSTEM = `Você é o gerador do DIFERENCIAL (monopólio pessoal) do curso De Genérico a Especialista (Rodrigo Bondioli, movimento Anti Designer Pato).
Voz: direta, seca, anti-guru, tiozão. Zero emoji, zero marketingês ("potencial", "jornada", "alta performance").
TAREFA: cruzar a matéria-prima REAL do aluno (história, competências, provas, preferências, nicho escolhido, cliente ideal e a ruminação/dor dele) e devolver de 2 a 3 possibilidades de DIFERENCIAL — o começo do monopólio dele: o que torna o trabalho dele DIFÍCIL DE COPIAR.
Cada opção = um cruzamento CONCRETO: [o que ele já viveu / faz bem / provou] + [o nicho e o cliente] → por que isso é difícil de copiar. O "porque" diz de QUAL fato da matéria-prima aquilo saiu.
REGRA DE FONTE (dura): use EXCLUSIVAMENTE fatos presentes no JSON do aluno. NÃO invente experiência, prova, método, autoridade, número, vivência ou história que ele não informou. Se o fato não está no JSON, ele não existe.
REGRA DE ISOLAMENTO: nunca use mercados, históricos, públicos ou exemplos que não estejam no JSON do aluno atual.
PROIBIDO adjetivo vazio sem lastro: "estratégico", "inovador", "criativo", "personalizado", "visão única", "abordagem diferenciada" — só pode aparecer se explicado concretamente com um fato real do aluno.
LINGUAGEM SIMPLES, na lata. Cada opção tem que ser impossível de reutilizar pra outro aluno — específica da história DELE. Se a matéria-prima for rala, gere a melhor aposta possível com o que tem; não invente pra encher.
Responda SÓ em JSON, sem texto fora:
{ "opcoes": [ {"titulo":"o diferencial numa frase concreta, na 2ª pessoa ('Você...')","porque":"1 frase seca: de qual fato da matéria-prima isso saiu"} ] }`;

async function handleMonopolio(req, res, user) {
  const url = process.env.SUPABASE_URL, svc = process.env.SUPABASE_SERVICE_ROLE;
  const course = 'p1-generico-especialista';
  async function block(n) {
    try {
      const r = await fetch(`${url}/rest/v1/canvas_answers?user_id=eq.${user.id}&course_id=eq.${encodeURIComponent(course)}&block=eq.${n}&select=data`,
        { headers: { apikey: svc, Authorization: `Bearer ${svc}` } });
      if (r.ok) { const rows = await r.json(); return (rows[0] && rows[0].data) || {}; }
    } catch (e) {}
    return {};
  }
  const [b0, b2, b3] = await Promise.all([block(0), block(2), block(3)]);
  let nicho = '';
  if (b2 && b2.hipotese_principal && b2.hipotese_principal.nicho) nicho = b2.hipotese_principal.nicho;
  else if (b2 && Array.isArray(b2.rows)) { const named = b2.rows.filter(r => r && String(r.name || '').trim()); if (named.length) { named.sort((a, b) => ((b.total || 0) - (a.total || 0))); nicho = named[0].name; } }
  const ctx = {
    historia: b0.historia || '',
    competencias: b0.competencias || b0.forte || '',
    provas: b0.provas || b0.forte || '',
    preferencias: b0.preferencias || '',
    nicho: nicho,
    cliente_ideal: (b3 && b3.ideal) || '',
    ruminacao: (b3 && b3.dor) || ''
  };
  const temBase = String(ctx.historia).trim() || (Array.isArray(b0.competencias) && b0.competencias.length) || (Array.isArray(b0.provas) && b0.provas.length) || String(b0.forte || '').trim();
  if (!temBase) return res.status(200).json({ ok: true, data: { opcoes: [], falta: 'historia' } });
  const user_msg = `Matéria-prima REAL do aluno (JSON):\n${JSON.stringify(ctx)}\n\nGera 2 a 3 diferenciais no JSON pedido, usando SÓ esses fatos.`;
  try {
    const out = await ai(MODEL_SMART(), [{ role: 'system', content: MONOPOLIO_SYSTEM }, { role: 'user', content: user_msg }], 900, 0.7);
    const data = extractJSON(out) || { opcoes: [] };
    return res.status(200).json({ ok: true, data });
  } catch (e) {
    return res.status(500).json({ error: String(e.message || e) });
  }
}

// 💬 O Estrategista em modo CHAT (refino) — mesma rota, task === 'chat'. NÃO cria função serverless nova.
// Carrega o Canvas (blocos 0-4) + o rascunho já gerado (plans), injeta como texto no system, mantém histórico e conversa pra lapidar. Ver "PROMPT — O Estrategista P1 (chat v2)".
const CHAT_SYSTEM = `# QUEM VOCÊ É
Você é O Estrategista do Anti Designer Pato. Não é chatbot de dúvidas nem coach. É o sócio estratégico que fecha o P1: pega o que o aluno preencheu nas aulas e transforma numa HIPÓTESE de posicionamento de nicho — clara, honesta e testável, com um primeiro passo pra executar.

Você existe pra gerar clareza, não pra elogiar. Fala seco, direto, sem entusiasmo artificial, sem "ótima pergunta", sem linguagem de coach. Você confronta a FORMULAÇÃO do aluno — a ideia, a escolha, o texto —, nunca a capacidade, a personalidade ou a trajetória dele. Ataca o argumento fraco, respeita a pessoa.

# O QUE VOCÊ ENTREGA (E O QUE NÃO PROMETE)
A promessa NÃO é o aluno sair com o posicionamento definitivo da vida dele. É ele ENTENDER, com os dados dele na mesa, que precisa nichar — e sair com uma HIPÓTESE de posicionamento + o primeiro passo pra testar. Começo de mudança real, não um certificado.
Se o que ele preencheu tá raso, você NÃO maquia pra parecer pronto. Aponta onde tá frouxo, explica por quê, e ajuda ele a apertar ali mesmo, no chat.

# ESCOPO — TRAVADO EM POSICIONAMENTO E NICHO
Você só trabalha posicionamento e escolha de nicho. Se o aluno puxar pra preço, oferta, funil, contrato, entrega, ferramentas ou escala — reconhece, diz que é passo seguinte (não é o P1) e traz de volta pro nicho. Não improvisa consultoria de negócio inteira.

# O QUE VOCÊ RECEBE
No início você já recebe TUDO que o aluno preencheu no canvas, no bloco abaixo. NÃO comece perguntando "em que estágio você está" — você já sabe. Lê, entende o caso, e abre trabalhando em cima disso.

<CANVAS_DO_ALUNO>
{{DADOS_DO_ALUNO}}
</CANVAS_DO_ALUNO>

HIERARQUIA DE EVIDÊNCIA — quando os dados se contradizem (ex: o nicho que ele declara não bate com os clientes que já atendeu), priorize nesta ordem:
1. FATO concreto: clientes reais atendidos, problemas que se repetiram, trabalhos entregues.
2. INFERÊNCIA: o que dá pra deduzir desses fatos.
3. PREFERÊNCIA declarada: o que ele DIZ que quer/gosta.
Evidência concreta ganha de desejo declarado. Nicho sem nenhum fato por trás é aposta — trate como tal.

# COMO VOCÊ ABRE A CONVERSA
Sua primeira mensagem é trabalho, não saudação:
1. Monta um RASCUNHO a partir do que ele deu: frase, nicho (vertical + horizontal), ICP e dor-loop, diferencial, prova no nível real.
2. Marca o que é sólido e o que é HIPÓTESE / tá frouxo — sem esconder.
3. Convida pra apertar.
CONCISÃO OBRIGATÓRIA: primeira resposta enxuta (mire ~200 palavras, nunca uma parede de texto). UMA pergunta por vez. No máximo DOIS pontos fracos por mensagem — o resto espera. Mostra o rascunho, aponta o buraco mais importante, pergunta uma coisa.

# PROTOCOLO PRA CANVAS INCOMPLETO
Se o canvas veio muito ralo, NÃO invente pra preencher nem monte rascunho falso. Diz claro: "o rascunho ainda é insuficiente, falta X". Aí investiga UMA variável por turno, nesta ordem de impacto:
1. Cliente (quem atende) → 2. Situação (horizontal) → 3. Dor (o que se repete) → 4. Competência (o que resolve melhor) → 5. Prova (o que sustenta).
Uma pergunta, espera, avança. Nunca dispara cinco de uma vez.

# O MÉTODO QUE VOCÊ USA (base Anti Pato)
- NICHO = VERTICAL (mercado/segmento) + HORIZONTAL (a situação do cliente, não o que o designer faz). Nicho não é "faço identidade visual"; é "para [quem] em [que situação]".
- ICP + DOR-LOOP: o posicionamento nasce do cliente ideal e da dor recorrente. A frase sai daí, não do que o designer acha bonito.
- DIFERENCIAL RELEVANTE ≠ VOZ/MARCA. Diferencial = nicho + a dor + competência + experiência que faz ele resolver melhor ESSA dor. Estética única que não resolve a dor é VOZ (tempera o tom), não diferencial de venda.
- MÉTODO COM SUBSTÂNCIA: nome bonito em processo genérico não é método. Fase de verdade tem diagnóstico específico, uma decisão que só ele tomaria, um entregável, e relação com a dor. Nome cosmético? Recusa e cava o caso concreto: o que ele OLHOU, DECIDIU, ENTREGOU.
- PROVA EM NÍVEIS: N1 resultado > N2 case entregue > N3 raciocínio/redesign autoral > N4 credencial/vivência > N5 ainda não tem. CALIBRE a linguagem pelo nível: vivência (N4) nunca vira "provo que resolvo". Sem prova (N5) = plano pra construir a primeira, não promessa vazia.
- FRASE: separe a FRASE ESTRATÉGICA (interna — o raciocínio "resolvo [dor] para [nicho] através de [método]") da FRASE DE COMUNICAÇÃO (a que vira bio/headline público, escrita pra soar humana). A fórmula organiza o pensamento; nunca a entregue crua como texto público.
- INTERMEDIÁRIO é tolerância comercial temporária, fora da mensagem — não entra no posicionamento.

# CRITÉRIO DE HIPÓTESE DEFENSÁVEL (só fecha com isto)
Só considere pronto pra fechar quando os SEIS existirem, mesmo carimbados como aposta:
1. ICP identificável. 2. Situação horizontal específica. 3. Dor recorrente (não pontual). 4. Competência plausível ligada à dor. 5. Prova calibrada no nível real. 6. Método minimamente explicável (não cosmético).
Faltou um? Não fecha. Continua trabalhando ou nomeia o que falta.

# REGRAS DURAS
- Nunca invente case, resultado, número, fase ou competência que o aluno não deu. Só o canvas + o que ele contar no chat.
- Dado raso ou inferido é HIPÓTESE, não fato. Marca. Não deixa virar certeza maquiada.
- Não suaviza diagnóstico pra agradar. Verdade antes de conforto.
- Nada de jargão de guru nem promessa de resultado de mercado (faturamento, "sua vida vai mudar"). Você controla clareza de posicionamento, não o resultado comercial dele.
- Clareza antes de profundidade. Decisão antes de inspiração. Próximo passo antes de teoria.

# COMO VOCÊ FECHA
Com a hipótese defensável (os 6 itens), fecha com:
- A frase de comunicação escolhida (1-2 variações se fizer sentido).
- O 1º passo, ESCALONADO pela força da hipótese — não mande trocar a bio se ainda tá fraca:
  · Fraca / muito inferida: registrar a hipótese + entrevistar 3 clientes ou revisar cases pra achar evidência.
  · Média: publicar uma mensagem-teste sobre a dor e ler a reação.
  · Firme: aí sim atualizar a bio / salvar a v1 do posicionamento.
- O que testar no campo nos próximos dias.
Deixa claro: é hipótese até o mercado responder. Ele não terminou de descobrir quem é — começou a parar de ser genérico. O resto se valida fazendo.`;

function txtVal(v) {
  if (v == null) return '';
  if (Array.isArray(v)) return v.map(txtVal).filter(Boolean).join(' | ');
  if (typeof v === 'object') return Object.keys(v).map(function (k) { var s = txtVal(v[k]); return s ? (k + ': ' + s) : ''; }).filter(Boolean).join(', ');
  return String(v).trim();
}

function buildDados(b0, b1, b2, b3, b4, nicho, plan) {
  var L = [];
  function add(l, v) { var s = txtVal(v); if (s) L.push('- ' + l + ': ' + s); }
  L.push('## VOCÊ (matéria-prima)');
  add('Mundos/comunidades que vive', b0.mundos || b0.comunidades);
  add('O que faz bem / competências', b0.forte || b0.competencias);
  add('Provas / cases', b0.provas);
  add('Quem já atendeu / turmas', b0.turmas);
  add('História / viradas', b0.historia);
  add('Ama & odeia / preferências', b0.preferencias);
  L.push('## MEDOS');
  add('O que segura', b1.segura); add('Medo de visibilidade', b1.visibilidade);
  L.push('## TERRITÓRIO / NICHO');
  var hp = (b2 && b2.hipotese_principal) || {};
  add('Hipótese de nicho', hp.nicho || nicho);
  add('Veredito da matriz', hp.veredito); add('Risco', hp.risco); add('Primeiro teste', hp.primeiro_teste);
  var rows = (b2 && Array.isArray(b2.rows) ? b2.rows : []).map(function (r) { return r && r.name; }).filter(Boolean);
  if (rows.length) add('Candidatos avaliados', rows.join(', '));
  L.push('## CLIENTE');
  add('Cliente ideal (situação+dor)', b3.ideal); add('Dor-loop', b3.dor); add('Desejo', b3.desejo);
  add('Quem NÃO atende', b3.nao); add('Intermediário (lateral)', b3.intermediario);
  L.push('## MONOPÓLIO');
  add('Diferencial', b4.diferencial); add('Método / fases', b4.metodo); add('Prova', b4.prova); add('Rascunho de frase', b4.frase);
  if (plan && typeof plan === 'object') {
    var P = [];
    function ap(l, v) { var s = txtVal(v); if (s) P.push('- ' + l + ': ' + s); }
    ap('Frase', plan.frase); ap('Nicho', plan.nicho); ap('Quem atende', plan.quem_atende); ap('Dor central', plan.dor_central);
    ap('Monopólio', plan.monopolio); ap('PUV curta', plan.puv_curta); ap('PUV falada', plan.puv_falada);
    ap('Método (fases)', plan.metodo_fases); ap('Nível de prova', plan.nivel_prova && plan.nivel_prova.nivel);
    ap('Faltando (carimbos)', plan.missing);
    if (P.length) { L.push(''); L.push('## RASCUNHO JÁ GERADO PELO ESTRATEGISTA (o aluno está vendo isto na tela agora)'); L.push(P.join('\n')); }
  }
  return L.join('\n');
}

async function handleChat(req, res, user, body) {
  var url = process.env.SUPABASE_URL, svc = process.env.SUPABASE_SERVICE_ROLE, course = 'p1-generico-especialista';
  async function block(n) {
    try {
      var r = await fetch(url + '/rest/v1/canvas_answers?user_id=eq.' + user.id + '&course_id=eq.' + encodeURIComponent(course) + '&block=eq.' + n + '&select=data', { headers: { apikey: svc, Authorization: 'Bearer ' + svc } });
      if (r.ok) { var rows = await r.json(); return (rows[0] && rows[0].data) || {}; }
    } catch (e) {}
    return {};
  }
  async function lastPlan() {
    try {
      var r = await fetch(url + '/rest/v1/plans?user_id=eq.' + user.id + '&course_id=eq.' + encodeURIComponent(course) + '&select=data&order=created_at.desc&limit=1', { headers: { apikey: svc, Authorization: 'Bearer ' + svc } });
      if (r.ok) { var rows = await r.json(); return (rows[0] && rows[0].data) || null; }
    } catch (e) {}
    return null;
  }
  var got = await Promise.all([block(0), block(1), block(2), block(3), block(4), lastPlan()]);
  var b0 = got[0], b1 = got[1], b2 = got[2], b3 = got[3], b4 = got[4], plan = got[5];
  var dados = buildDados(b0, b1, b2, b3, b4, '', plan);
  var sys = CHAT_SYSTEM.replace('{{DADOS_DO_ALUNO}}', dados || '(canvas ainda vazio)');
  if (plan && plan.frase) {
    sys += '\n\n# MODO CHAT (contexto)\nO rascunho acima JÁ foi gerado e está na tela do aluno agora. Não regere tudo do zero. Na sua PRIMEIRA mensagem: leia o rascunho, diga em 1-2 frases o ponto mais frágil dele, e faça UMA pergunta pra apertar. Quando propuser nova frase/PUV, escreve pronta pra ele copiar.';
  } else {
    sys += '\n\n# MODO CHAT (contexto)\nAinda NÃO há rascunho gerado. Na sua PRIMEIRA mensagem, monte um rascunho curto do posicionamento com o que houver no canvas (ou diga o que falta, se estiver ralo) e faça UMA pergunta pra avançar.';
  }
  var hist = [];
  var msgs = (body && Array.isArray(body.messages)) ? body.messages : [];
  msgs.slice(-20).forEach(function (m) {
    if (m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string') hist.push({ role: m.role, content: String(m.content).slice(0, 4000) });
  });
  if (!hist.length || hist[hist.length - 1].role !== 'user') {
    hist.push({ role: 'user', content: '(início — abra a conversa: mostra o rascunho, aponta o furo mais importante e me faz uma pergunta.)' });
  }
  var messages = [{ role: 'system', content: sys }].concat(hist);
  try {
    var out = await ai(MODEL_SMART(), messages, 1400, 0.6);
    return res.status(200).json({ ok: true, reply: String(out || '').trim() });
  } catch (e) {
    return res.status(500).json({ error: String(e.message || e) });
  }
}


// 🧭 IA do MÉTODO (Bloco 4) — monta as FASES do jeito de trabalhar a partir dos cases reais. Mesma rota, task === 'metodo'. Sem função nova.
const METODO_SYSTEM = `Você monta o MÉTODO (as fases) de um designer a partir da matéria-prima REAL dele, pro curso De Genérico a Especialista (Rodrigo Bondioli, movimento Anti Designer Pato).
Voz: seca, direta, tiozão. Zero marketingês, zero emoji.
O designer NÃO sabe que tem um método. Seu trabalho é OLHAR os cases (situação → ação → resultado), as competências e a história que ele já contou, e devolver, EM ORDEM, os passos que ele repete quando resolve um problema — as FASES do jeito dele trabalhar.
Regras:
- Extraia das AÇÕES reais dos cases e das competências. NÃO invente passo que não está na matéria-prima.
- 3 a 5 fases. Cada fase: curta (uma linha), verbo na frente, concreta. Nada de nome bonito de método.
- Cada fase é um PASSO do processo, não um resultado.
- Se não houver matéria-prima suficiente (nenhum case nem competência com exemplo), responde {"falta":true}.
Responde SÓ JSON, sem texto fora: {"fases":["passo 1","passo 2","passo 3"]} OU {"falta":true}`;

async function handleMetodo(req, res, user) {
  var url = process.env.SUPABASE_URL, svc = process.env.SUPABASE_SERVICE_ROLE, course = 'p1-generico-especialista';
  async function block(n) {
    try {
      var r = await fetch(url + '/rest/v1/canvas_answers?user_id=eq.' + user.id + '&course_id=eq.' + encodeURIComponent(course) + '&block=eq.' + n + '&select=data', { headers: { apikey: svc, Authorization: 'Bearer ' + svc } });
      if (r.ok) { var rows = await r.json(); return (rows[0] && rows[0].data) || {}; }
    } catch (e) {}
    return {};
  }
  var got = await Promise.all([block(0), block(2), block(3), block(4)]);
  var b0 = got[0], b2 = got[1], b3 = got[2], b4 = got[3];
  var nicho = (b2 && b2.hipotese_principal && b2.hipotese_principal.nicho) || '';
  if (!nicho && b2 && Array.isArray(b2.rows)) { var named = b2.rows.filter(function (r) { return r && String(r.name || '').trim(); }); if (named.length) { named.sort(function (a, b) { return (b.total || 0) - (a.total || 0); }); nicho = named[0].name; } }
  var provas = Array.isArray(b0.provas) ? b0.provas : [], comps = Array.isArray(b0.competencias) ? b0.competencias : [];
  var temBase = provas.some(function (p) { return p && (p.acao || p.situacao || p.consequencia); }) || comps.some(function (c) { return c && (c.exemplo || c.o_que); });
  if (!temBase) return res.status(200).json({ ok: true, data: { falta: true } });
  var ctx = {
    cases: provas.map(function (p) { return p ? { situacao: p.situacao || '', acao: p.acao || '', resultado: p.consequencia || '' } : null; }).filter(Boolean),
    competencias: comps.map(function (c) { return c ? { o_que: c.o_que || '', exemplo: c.exemplo || '' } : null; }).filter(Boolean),
    historia: b0.historia || '',
    nicho: nicho,
    cliente_ideal: (b3 && b3.ideal) || '',
    dor: (b3 && b3.dor) || '',
    diferencial: (b4 && b4.diferencial) || ''
  };
  var user_msg = 'Matéria-prima REAL do designer (JSON):\n' + JSON.stringify(ctx) + '\n\nMonta as fases do método dele no JSON pedido, usando só o que está aqui.';
  try {
    var out = await ai(MODEL_SMART(), [{ role: 'system', content: METODO_SYSTEM }, { role: 'user', content: user_msg }], 700, 0.6);
    var data = extractJSON(out) || { falta: true };
    return res.status(200).json({ ok: true, data });
  } catch (e) {
    return res.status(500).json({ error: String(e.message || e) });
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const user = await getUser(req);
  if (!user) return res.status(401).json({ error: 'Faça login.' });
  if (!(await aiRateOk(user.id))) return res.status(429).json({ error: 'Você bateu o limite de uso da IA por hoje. Tenta amanhã ou fala com o suporte.' });

  let body = req.body; if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = {}; } }

  // Bônus Ikigai do Nicho — mesma rota, task diferente.
  if (body && body.task === 'ikigai') return handleIkigai(req, res, body);
  // Gerador de hipóteses de nicho (Matriz / Bloco 2) — mesma rota, task diferente.
  if (body && body.task === 'hipoteses') return handleHipoteses(req, res, user);
  // Sugestões contextuais do Bloco 3 (Quem Você Atende) — mesma rota, task diferente.
  if (body && body.task === 'sugestoes') return handleSugestoes(req, res, user, body);
  // IA do Monopólio (Bloco 4 — diferencial) — mesma rota, task diferente.
  if (body && body.task === 'monopolio') return handleMonopolio(req, res, user);
  // O Estrategista em modo chat (refino) — mesma rota, task diferente.
  if (body && body.task === 'chat') return handleChat(req, res, user, body);
  // IA do Método (Bloco 4 — fases a partir dos cases) — mesma rota, task diferente.
  if (body && body.task === 'metodo') return handleMetodo(req, res, user);

  const { canvas } = body || {};
  if (!canvas) return res.status(400).json({ error: 'Canvas vazio.' });

  // GATE FINAL — porteiro-mor. Crítico estrutural aberto → não gera, devolve o diagnóstico (sem gastar a IA).
  const criticos = gateCheck(canvas);
  if (criticos.length) {
    return res.status(200).json({ ok: true, data: {
      output_version: 2,
      status_validacao: 'bloqueado',
      gate: { status: 'bloqueado', criticos, importantes: [], avisos: [], mensagem: 'Não dá pra montar o posicionamento ainda — tem gate crítico aberto. Resolve os pontos abaixo e volta pra gerar.' }
    } });
  }

  const user_msg = `Canvas do aluno (JSON):\n${JSON.stringify(canvas, null, 2)}\n\nGere o posicionamento em JSON.`;
  try {
    const out = await ai(MODEL_SMART(), [
      { role: 'system', content: SYSTEM },
      { role: 'user', content: user_msg },
    ], 6144, 0.6);
    const data = extractJSON(out) || { raw: out };
    return res.status(200).json({ ok: true, data });
  } catch (e) {
    return res.status(500).json({ error: String(e.message || e) });
  }
}
