// Fonte única dos blocos do Canvas. Usado inline na aula E na tela Meu Canvas.
// Cada bloco = matéria-prima que o Estrategista lê no final.
// Salva via window.ADP.saveBlock(block, data) e carrega via window.ADP.loadCanvas().
window.ADP_CANVAS = (function () {
  // Matriz v2 — 2 eixos, 7 critérios. Cada nota (1-5) leva EVIDÊNCIA + CONFIANÇA. Sem soma ponderada: dois totais por eixo + regras de inviabilidade.
  var EIXOS = [
    { key: 'mercado', h: 'Mercado', max: 20, crit: [
      { k: 'intensidade', h: 'Intensidade',      hint: 'Essa dor é forte ou só seria bom resolver?' },
      { k: 'urgencia',    h: 'Urgência',         hint: 'Resolve agora ou dá pra empurrar?' },
      { k: 'crescimento', h: 'Crescimento',      hint: 'Esse mercado cresce, para ou encolhe?' },
      { k: 'poder',       h: 'Poder de compra',  hint: 'Tem verba e decide gastar com isso?' }
    ]},
    { key: 'voce', h: 'Você', max: 15, crit: [
      { k: 'repertorio', h: 'Repertório',       hint: 'Você já conhece esse mundo por dentro?' },
      { k: 'acesso',     h: 'Acesso',           hint: 'Consegue chegar no decisor em 30 dias?' },
      { k: 'aderencia',  h: 'Aderência / Prova', hint: 'Já tem caso ou prova que gruda aqui?' }
    ]}
  ];
  var CRIT7 = EIXOS.reduce(function (a, e) { return a.concat(e.crit.map(function (c) { return { k: c.k, eixo: e.key, h: c.h, hint: c.hint }; })); }, []);
  var CRITDEF = {}; CRIT7.forEach(function (c) { CRITDEF[c.k] = c; });
  var CONF_W = { alta: 2, media: 1, baixa: 0 };

  var BLOCKS = [
    { block: 0, title: 'Sobre Você', type: 'fields', fields: [
      { key: 'mundos',   label: 'Mundos que você já conhece por dentro', ph: 'Trampo antigo, negócio da família, hobby, paixão — mercados que você já vive.' },
      { key: 'forte',    label: 'O que sai fácil e onde você já tem prova', ph: 'O projeto que sai quase no automático — e pra que tipo de cliente você já tem trabalho pra mostrar.' },
      { key: 'turmas',   label: 'Suas turmas e comunidades',              ph: 'Academia, futebol, RPG, igreja, trampo antigo, pais de pet… onde esse tipo de dono se encontra.' },
      { key: 'historia', label: 'Sua história',                           ph: 'De onde você veio e por que faz o que faz do jeito que faz. O que só você tem.' }
    ]},
    { block: 1, title: 'O Inimigo (seus medos)', type: 'fields', fields: [
      { key: 'segura',       label: 'O que te segura no genérico',        ph: 'Qual medo te trava pra nichar? Manda sem filtro — medo no papel encolhe.' },
      { key: 'visibilidade', label: 'Como teu cliente ideal te acharia hoje?', ph: 'Hoje, quantos cliques até alguém chegar em você? Sem maquiar.' }
    ]},
    { block: 2, title: 'A Matriz do Nicho', type: 'matrix' },
    { block: 3, title: 'Quem Você Atende (a dor)', type: 'fields', fields: [
      { key: 'nao',           label: 'Quem eu NÃO atendo (obrigatório)',  ph: 'Quem você recusa. Começa por aqui — posicionamento é dizer não.' },
      { key: 'ideal',         label: 'Cliente ideal — situação e dor',    ph: 'Não idade e CEP. A situação que ele vive e a dor que o mantém acordado.' },
      { key: 'intermediario', label: 'Cliente intermediário',             ph: 'Serve, mas não é o sonho.' },
      { key: 'dor',           label: 'A dor-loop principal',              ph: 'A vozinha que não cala na cabeça dele. Roda a Caça à Ruminação se travar.' },
      { key: 'desejo',        label: 'O que ele quer no lugar (o desejo)',ph: 'Não a dor — o estado que ele quer alcançar. Pra onde ele quer chegar quando a dor sumir.' }
    ]},
    { block: 4, title: 'Seu Monopólio', type: 'fields', fields: [
      { key: 'diferencial', label: 'Seu diferencial que ninguém copia', ph: 'Tua história, o que só você tem — o cruzamento do nicho com quem você é.' },
      { key: 'metodo',      label: 'Seu método — as fases',             ph: 'Não um nome bonito. Os passos reais de como você resolve, em ordem. Ex: 1) diagnóstico 2) recorte 3) execução. Sem fases, é só um rótulo.' },
      { key: 'prova',       label: 'Sua prova real (um caso com resultado)', ph: 'Um caso concreto: cliente, o que você fez, o que mudou. Número se tiver. Não tem prova ainda? Deixa vazio — não invente.' },
      { key: 'frase',       label: 'Rascunho da tua frase',             ph: 'Eu resolvo [a dor] para [o nicho] através de [o teu recorte]. Nem que fique tosco.' }
    ]}
  ];

  function byBlock(n) { for (var i = 0; i < BLOCKS.length; i++) if (BLOCKS[i].block === n) return BLOCKS[i]; return null; }
  function esc(s) { return String(s == null ? '' : s).replace(/[<>&"]/g, function (c) { return { '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' }[c]; }); }

  // ---------- Matriz v2: lógica pura (evidência + confiança + inviabilidade) ----------
  function cellOf(row, k) { var c = row && row.cells && row.cells[k]; return c || { nota: 0, ev: '', conf: '' }; }
  function nota(row, k) { return +(cellOf(row, k).nota) || 0; }
  function somaEixo(row, eixoKey) {
    var e = EIXOS.filter(function (x) { return x.key === eixoKey; })[0];
    return e.crit.reduce(function (s, c) { return s + nota(row, c.k); }, 0);
  }
  function anyScore(row) { return CRIT7.some(function (c) { return nota(row, c.k) >= 1; }); }
  function isScored(row) { return CRIT7.every(function (c) { return nota(row, c.k) >= 1; }); }
  function avgConf(row) {
    var vals = CRIT7.map(function (c) { var w = CONF_W[cellOf(row, c.k).conf]; return w != null ? w : 0; });
    return vals.reduce(function (a, b) { return a + b; }, 0) / (vals.length || 1);
  }
  function evMissing(row) {
    return CRIT7.filter(function (c) { return nota(row, c.k) >= 1 && !(cellOf(row, c.k).ev || '').trim(); }).length;
  }
  // confiança INFERIDA da evidência (não é mais escolha manual):
  // sem evidência → baixa · percepção/vaga → média · concreta/verificável (número, %, R$, data) → alta
  function inferConf(ev) {
    var t = (ev || '').trim();
    if (!t) return 'baixa';
    if (/\d|%|r\$|\bR\$/i.test(t)) return 'alta';
    return 'media';
  }
  // veredito qualitativo do candidato (substitui os pesos) — ver ARQ 3
  function verdict(row) {
    if (!anyScore(row)) return { tag: 'todo', txt: 'Pontua os 7 critérios (1–5) com evidência.' };
    var p = nota(row, 'poder'), u = nota(row, 'urgencia'), ac = nota(row, 'acesso'), ad = nota(row, 'aderencia');
    if (p >= 1 && p <= 2) return { tag: 'inviavel', txt: 'Poder de compra no chão — mata o nicho, não importa o resto.' };
    if (u >= 1 && u <= 2) return { tag: 'alerta', txt: 'Sem urgência: mercado que elogia e não compra.' };
    if (ac >= 1 && ac <= 2 && ad >= 1 && ad <= 2) return { tag: 'alerta', txt: 'Acesso e prova baixos — hipótese cara de testar.' };
    if (!isScored(row)) return { tag: 'todo', txt: 'Falta pontuar critério — completa os 7 pra fechar.' };
    var sm = somaEixo(row, 'mercado'), sv = somaEixo(row, 'voce');
    if (sm >= 14 && sv <= 6) return { tag: 'construcao', txt: 'Mercado forte, você fraco — aposta de construção. 1º movimento: construir prova/acesso.' };
    if (sm <= 8 && sv >= 11) return { tag: 'confortavel', txt: 'Você forte, mercado fraco — zona confortável sem negócio.' };
    return { tag: 'ok', txt: 'Passa nos dois eixos — viável pra testar 30 dias.' };
  }
  function menorDimensao(row) {
    return somaEixo(row, 'voce') < somaEixo(row, 'mercado')
      ? 'Teu lado (repertório/acesso/prova) é o elo fraco — reforça a prova.'
      : 'O mercado é o elo fraco — confirma urgência e poder de compra.';
  }
  function primeiroTeste(row) {
    var scored = CRIT7.filter(function (c) { return nota(row, c.k) >= 1; }).slice();
    scored.sort(function (a, b) { return (CONF_W[cellOf(row, a.k).conf] || 0) - (CONF_W[cellOf(row, b.k).conf] || 0); });
    var alvo = scored[0];
    if (alvo && (CONF_W[cellOf(row, alvo.k).conf] || 0) <= 0) return 'Validar ' + CRITDEF[alvo.k].h + ': ' + CRITDEF[alvo.k].hint;
    return 'Confirmar a dor com 2–3 donos reais do nicho.';
  }
  // campeão = melhor candidato viável (fecha os 2 eixos, não-inviável); desempate por confiança e aderência, nunca por nota nua
  function champion(rows) {
    var viable = (rows || []).filter(function (r) { return (r.name || '').trim() && isScored(r) && verdict(r).tag !== 'inviavel'; });
    if (!viable.length) return null;
    viable.sort(function (a, b) {
      var ta = somaEixo(a, 'mercado') + somaEixo(a, 'voce'), tb = somaEixo(b, 'mercado') + somaEixo(b, 'voce');
      if (tb !== ta) return tb - ta;
      if (avgConf(b) !== avgConf(a)) return avgConf(b) - avgConf(a);
      return nota(b, 'aderencia') - nota(a, 'aderencia');
    });
    return viable[0];
  }
  function hipotesePrincipal(rows) {
    var w = champion(rows); if (!w) return null;
    var v = verdict(w);
    return {
      nicho: w.name,
      soma_mercado: somaEixo(w, 'mercado'),
      soma_voce: somaEixo(w, 'voce'),
      veredito: v.txt,
      risco: v.tag === 'ok' ? menorDimensao(w) : v.txt,
      primeiro_teste: primeiroTeste(w)
    };
  }
  function normRow(r) {
    r = r || {};
    var cells = r.cells || {};
    // migração leve do formato antigo (r,n,c,p,a) → cells v2 (pré-lançamento; sem dados reais, mas não perde o que tiver)
    if (!r.cells && (r.r != null || r.n != null || r.c != null || r.p != null || r.a != null)) {
      var old = { intensidade: r.n, crescimento: r.c, poder: r.p, repertorio: r.r, acesso: r.a };
      cells = {};
      Object.keys(old).forEach(function (k) { cells[k] = { nota: +old[k] || 0, ev: '', conf: '' }; });
    }
    var out = { name: r.name || '', obs: r.obs || '', cells: {} };
    CRIT7.forEach(function (c) { var cc = cells[c.k] || {}; out.cells[c.k] = { nota: +cc.nota || 0, ev: cc.ev || '', conf: cc.conf || '' }; });
    return out;
  }

  // um bloco "preenchido" = tem pelo menos um valor não-vazio
  function hasContent(v) {
    if (v == null) return false;
    if (Array.isArray(v)) return v.some(function (it) {
      if (it == null) return false;
      if (typeof it === 'object') return Object.keys(it).some(function (kk) { return String(it[kk] == null ? '' : it[kk]).trim(); });
      return String(it).trim();
    });
    if (typeof v === 'object') return Object.keys(v).some(function (kk) { return hasContent(v[kk]); });
    return String(v).trim();
  }
  function isFilled(block, data) {
    if (!data) return false;
    if (block === 2) return !!(data.rows && data.rows.some(function (r) { return (r.name || '').trim(); }));
    // ignora chaves meta (_chat etc.) e vazios reais (arrays/objetos vazios, strings em branco)
    return Object.keys(data).some(function (k) { return k.charAt(0) !== '_' && hasContent(data[k]); });
  }

  var STYLE = ''
    + '.adp-fld{margin-top:18px}'
    + '.adp-fld label{display:block;font-size:16px;font-weight:700;color:var(--ink,#18181b);margin-bottom:5px;letter-spacing:-.01em;line-height:1.4}'
    + '.adp-fld .adp-hint{font-size:12.5px;color:var(--muted,#71717a);margin:0 0 9px;line-height:1.45;max-width:70ch}'
    + '.adp-fld textarea{width:100%;border:1px solid var(--line,#d4d4d8);border-radius:16px;background:none;padding:13px 15px;font:inherit;font-size:14.5px;color:var(--ink,#18181b);resize:none;min-height:70px;line-height:1.55;transition:border-color .15s}'
    + '.adp-fld textarea::placeholder{color:var(--faint,#a1a1aa)}'
    + '.adp-fld textarea:focus{outline:none;border-color:var(--line,#d4d4d8)}'
    + '.adp-savest{font-size:12px;color:var(--faint,#a1a1aa);margin-top:9px;min-height:1em}'
    + '.adp-savest.err{color:var(--pink,#ff00d7);font-weight:700}'
    // --- Matriz v5 (esqueleto da lista de aulas da HOME: módulo por eixo + linhas tipo aula) ---
    + '.adp-mx{margin-top:8px;display:flex;flex-direction:column;gap:18px}'
    + '.mx-cbar{display:flex;align-items:center;gap:12px;border:1px solid var(--line,#d4d4d8);border-radius:12px;padding:14px 18px;cursor:pointer;background:var(--soft,#e6e6e8)}'
    + '.mx-cbar:hover{filter:brightness(.985)}'
    + '.mx-cbtitle{font-weight:700;font-size:14px;color:var(--ink,#18181b);flex:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}'
    + '.mx-cbread{font-size:12.5px;color:var(--muted,#71717a);flex:none}'
    + '.mx-cbar .chev{width:16px;height:16px;fill:none;stroke:var(--muted,#71717a);stroke-width:2;flex:none}'
    + '.mx-cand{display:flex;flex-direction:column;gap:12px}'
    + '.mx-cand-h{display:flex;align-items:center;gap:12px;padding:2px 4px 2px}'
    + '.mx-idc{flex:1;min-width:0;display:flex;flex-direction:column;gap:1px}'
    + '.mx-lead{font-weight:700;font-size:10.5px;letter-spacing:.08em;text-transform:uppercase;color:var(--faint,#a1a1aa)}'
    // segundo eixo respira mais que o gap padrão (separa seção sem virar card)
    + '.mx-eixomod + .mx-eixomod{margin-top:14px}'
    + '.mx-name{width:100%;border:none;border-bottom:1px solid transparent;background:transparent;font:inherit;font-weight:700;font-size:19px;line-height:1.28;letter-spacing:-.01em;color:var(--ink,#18181b);padding:1px 0;display:block;resize:none;overflow:hidden;white-space:pre-wrap;word-break:break-word}'
    + '.mx-name::placeholder{color:var(--faint,#a1a1aa);font-weight:400}'
    + '.mx-name:hover{border-bottom-color:var(--line,#d4d4d8)}'
    + '.mx-name:focus{outline:none;border-bottom-color:var(--ink,#18181b)}'
    + '.mx-state{flex:none;font-size:12px;font-weight:700;padding:7px 13px;border-radius:999px;line-height:1}'
    + '.mx-state.s-ok{background:var(--lime,#e7f99a);color:var(--ink,#18181b)}'
    + '.mx-state.s-mid{background:var(--soft,#e6e6e8);color:var(--muted,#71717a)}'
    + '.mx-state.s-bad{background:var(--ink,#18181b);color:#fff}'
    + '.mx-del{flex:none;font-size:12px;color:var(--muted,#71717a);text-decoration:underline;cursor:pointer;background:none;border:none;padding:2px}'
    + '.mx-del:hover{color:var(--ink,#18181b)}'
    + '.mx-collapse{flex:none;display:grid;place-items:center;width:28px;height:28px;border-radius:999px;border:1px solid var(--line,#d4d4d8);background:none;cursor:pointer;padding:0}'
    + '.mx-collapse svg{width:15px;height:15px;fill:none;stroke:var(--muted,#71717a);stroke-width:2;stroke-linecap:round;stroke-linejoin:round}'
    + '.mx-collapse:hover{border-color:var(--ink,#18181b)}.mx-collapse:hover svg{stroke:var(--ink,#18181b)}'
    // eixo = módulo (igual .module da HOME)
    + '.mx-eixomod{background:var(--card,transparent);border:1px solid var(--line,#d4d4d8);border-radius:12px;overflow:hidden}'
    + '.mx-eixohd{display:flex;align-items:center;gap:12px;padding:12px 18px;background:var(--soft,#e6e6e8)}'
    + '.mx-eixohd .et{font-size:13.5px;font-weight:700;color:var(--ink,#18181b);flex:none}'
    + '.mx-eixohd .etrack{flex:1;height:5px;border-radius:999px;background:rgba(16,16,16,.09);overflow:hidden;min-width:40px}'
    + '.mx-eixohd .etrack i{display:block;height:100%;background:var(--lime,#e7f99a);border-radius:999px;transition:width .3s}'
    + '.mx-eixohd .en{font-size:12.5px;font-weight:700;color:var(--ink,#18181b);flex:none}'
    // linha de critério: topo (nome+pergunta · nota) + FAIXA de evidência fixa no rodapé
    + '.mx-row{display:flex;flex-direction:column;gap:11px;padding:15px 20px;border-top:1px solid var(--line,#d4d4d8)}'
    + '.mx-rtop{display:flex;align-items:center;gap:18px}'
    + '.mx-c1{flex:1;min-width:0}'
    + '.mx-c1 .n{font-size:14.5px;font-weight:700;color:var(--ink,#18181b);line-height:1.25}'
    // pergunta reservada em 2 linhas: mantém TODA linha de critério na mesma altura
    + '.mx-c1 .q{font-size:12.5px;color:var(--muted,#71717a);margin-top:3px;line-height:1.4;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;min-height:2.8em}'
    + '.mx-ctrl{flex:none;display:flex;align-items:center}'
    + '.mx-nota{display:inline-flex;align-items:center;gap:6px}'
    + '.mx-nn{width:26px;height:26px;border-radius:999px;border:1px solid var(--line,#d4d4d8);background:none;font:inherit;font-weight:700;font-size:12px;color:var(--muted,#71717a);cursor:pointer;display:inline-grid;place-items:center;padding:0;transition:.12s}'
    + '.mx-nn:hover{border-color:var(--muted,#71717a);color:var(--ink,#18181b)}'
    + '.mx-nn.on{border-color:var(--ink,#18181b);background:var(--ink,#18181b);color:#fff}'
    // FAIXA de evidência: uma linha discreta, dot-separada, flui à esquerda; a evidência trunca, confiança/ação ficam
    + '.mx-evstrip{display:flex;align-items:center;gap:7px;min-height:30px;font-size:12.5px;cursor:pointer;border-top:1px solid var(--line,#d4d4d8);padding-top:11px;color:var(--muted,#71717a)}'
    + '.mx-evstrip .val{flex:0 1 auto;min-width:2ch;color:#3f3f46;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}'
    + '.mx-evstrip .val.none{color:var(--faint,#a1a1aa)}'
    + '.mx-evstrip .sep{flex:none;color:var(--faint,#a1a1aa)}'
    + '.mx-evstrip .cf{flex:none;color:var(--faint,#a1a1aa)}'
    + '.mx-evstrip .act{flex:none;font-weight:700;color:var(--muted,#71717a);text-decoration:underline;text-underline-offset:2px}'
    + '.mx-evstrip:hover .act{color:var(--ink,#18181b)}'
    // editor aberto (só a linha ativa): composer da HOME (sem chips — confiança é inferida)
    + '.mx-eved{display:flex;flex-direction:column;gap:10px}'
    + '.mx-evbar{display:flex;align-items:flex-start;gap:9px;border:1px solid var(--line,#d4d4d8);border-radius:16px;padding:6px 8px 6px 12px;background:none}'
    + '.mx-evspark{flex:none;display:flex;color:var(--faint,#a1a1aa);padding-top:9px}'
    + '.mx-evspark svg{width:16px;height:16px;fill:none;stroke:currentColor;stroke-width:1.7;stroke-linecap:round;stroke-linejoin:round}'
    + '.mx-ev{flex:1;min-width:0;border:none;background:none;padding:8px 0;font:inherit;font-size:14px;color:var(--ink,#18181b);resize:none;max-height:120px;line-height:1.5}'
    + '.mx-ev::placeholder{color:var(--faint,#a1a1aa)}'
    + '.mx-ev:focus{outline:none}'
    + '.mx-vd{padding:4px 4px 2px;font-size:13px;color:var(--ink,#18181b);display:flex;align-items:baseline;gap:9px;line-height:1.45}'
    + '.mx-vd .dot{width:7px;height:7px;border-radius:999px;flex:none;align-self:center}'
    + '.mx-vd .dot.ok{background:var(--lime,#e7f99a)}.mx-vd .dot.mid{background:var(--faint,#a1a1aa)}.mx-vd .dot.bad{background:var(--ink,#18181b)}'
    + '.mx-vd .vl{font-weight:700;flex:none}'
    + '.mx-vd .vx{color:#3f3f46;min-width:0}'
    + '.adp-addcand{margin-top:24px;padding:16px 2px 4px;font-size:12.5px;color:var(--muted,#71717a);border:none;border-top:1px solid var(--line,#d4d4d8);background:none;cursor:pointer;text-decoration:underline;text-underline-offset:2px;display:block;width:100%;text-align:left}'
    + '.adp-addcand:hover{color:var(--ink,#18181b)}'
    // --- Matriz v6: stepper (uma hipótese aberta + um critério por vez) ---
    + '.mx2-head{padding:2px 2px 0}'
    + '.mx2-metatop{display:flex;justify-content:space-between;align-items:center;gap:12px}'
    + '.mx2-lead{font-weight:700;font-size:10.5px;letter-spacing:.08em;text-transform:uppercase;color:var(--faint,#a1a1aa)}'
    + '.mx2-recolher{font-size:12px;color:var(--muted,#71717a);text-decoration:underline;cursor:pointer;background:none;border:none;padding:2px}'
    + '.mx2-recolher:hover{color:var(--ink,#18181b)}'
    + '.mx2-links{display:flex;gap:16px;margin-top:8px}'
    + '.mx2-link{font-size:12.5px;color:var(--muted,#71717a);text-decoration:underline;text-underline-offset:2px;cursor:pointer;background:none;border:none;padding:0;font-weight:700}'
    + '.mx2-link:hover{color:var(--ink,#18181b)}'
    + '.mx2-prog{display:flex;align-items:center;gap:14px;margin:24px 2px 4px;border-top:1px solid var(--line,#d4d4d8);padding-top:20px}'
    + '.mx2-progn{font-size:11px;font-weight:700;letter-spacing:.06em;color:var(--muted,#71717a);flex:none;text-transform:uppercase}'
    + '.mx2-dots{display:flex;gap:7px;flex:1;flex-wrap:wrap}'
    + '.mx2-dots i{width:9px;height:9px;border-radius:999px;background:var(--soft,#e6e6e8);border:1px solid var(--line,#d4d4d8);transition:.15s;cursor:pointer}'
    + '.mx2-dots i.on{background:var(--ink,#18181b);border-color:var(--ink,#18181b)}'
    + '.mx2-dots i.cur{background:var(--pink,#ff00d7);border-color:var(--pink,#ff00d7)}'
    + '.mx2-sec{font-weight:700;font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:var(--faint,#a1a1aa);margin:18px 2px 0}'
    + '.mx2-active{padding:12px 2px 4px}'
    + '.mx2-ctitle{font-size:21px;font-weight:700;letter-spacing:-.01em;color:var(--ink,#18181b);line-height:1.18}'
    + '.mx2-cq{font-size:13.5px;color:var(--muted,#71717a);margin:7px 0 18px;line-height:1.5;max-width:58ch}'
    + '.mx2-notes{display:flex;gap:10px;flex-wrap:wrap}'
    + '.mx2-nb{width:48px;height:48px;border-radius:13px;border:1px solid var(--line,#d4d4d8);background:none;font:inherit;font-weight:700;font-size:16px;color:var(--muted,#71717a);cursor:pointer;display:grid;place-items:center;transition:.12s}'
    + '.mx2-nb:hover{border-color:var(--ink,#18181b);color:var(--ink,#18181b)}'
    + '.mx2-nb.on{border-color:var(--ink,#18181b);background:var(--ink,#18181b);color:#fff}'
    + '.mx2-scale{display:flex;justify-content:space-between;font-size:11px;color:var(--faint,#a1a1aa);margin-top:9px;max-width:288px}'
    + '.mx2-done{display:flex;align-items:center;gap:12px;padding:12px 2px;border-top:1px solid var(--line,#d4d4d8)}'
    + '.mx2-done .di{flex:none;display:flex;color:var(--faint,#a1a1aa)}'
    + '.mx2-done .di svg{width:19px;height:19px;fill:none;stroke:currentColor;stroke-width:1.7;stroke-linecap:round;stroke-linejoin:round}'
    + '.mx2-done .dn{flex:1;min-width:0;font-size:13.5px;font-weight:700;color:var(--ink,#18181b);cursor:pointer}'
    + '.mx2-done .dv{flex:none;font-size:12px;font-weight:700;color:var(--ink,#18181b);background:var(--soft,#e6e6e8);border-radius:999px;padding:3px 11px;line-height:1.2}'
    + '.mx2-done .dx{flex:none;font-size:12px;color:var(--muted,#71717a);text-decoration:underline;cursor:pointer}'
    + '.mx2-done .dx:hover{color:var(--ink,#18181b)}'
    + '.mx2-expl{padding:0 2px 12px}'
    + '.mx2-expl textarea{width:100%;border:1px solid var(--line,#d4d4d8);border-radius:12px;background:none;padding:10px 12px;font:inherit;font-size:13.5px;color:var(--ink,#18181b);resize:none;min-height:54px;line-height:1.5}'
    + '.mx2-expl textarea:focus{outline:none;border-color:var(--ink,#18181b)}'
    + '.mx2-vd{display:flex;align-items:flex-start;gap:11px;margin-top:20px;padding:15px 17px;border:1px solid var(--line,#d4d4d8);border-radius:14px;background:var(--soft,#e6e6e8)}'
    + '.mx2-vd .vdi{flex:none;width:8px;height:8px;border-radius:999px;margin-top:6px}'
    + '.mx2-vd .vdi.ok{background:var(--lime,#e7f99a)}.mx2-vd .vdi.mid{background:var(--faint,#a1a1aa)}.mx2-vd .vdi.bad{background:var(--ink,#18181b)}'
    + '.mx2-vd .vdt b{font-size:14.5px;color:var(--ink,#18181b);font-weight:700}'
    + '.mx2-vd .vdt p{margin:4px 0 0;font-size:13px;color:var(--muted,#71717a);line-height:1.5}'
    + '.mx2-decide{margin-top:14px;display:flex;flex-direction:column;gap:11px;align-items:flex-start}'
    + '.mx2-cta{font-weight:700;font-size:14px;padding:12px 24px;border-radius:999px;background:var(--pink,#ff00d7);color:#fff;border:none;cursor:pointer;white-space:nowrap}'
    + '.mx2-cta:hover{filter:brightness(1.06)}'
    + '.mx2-secacts{display:flex;align-items:center;gap:10px;flex-wrap:wrap}'
    + '.mx2-seclink{font-size:12.5px;color:var(--muted,#71717a);text-decoration:underline;text-underline-offset:2px;background:none;border:none;cursor:pointer;padding:2px 0}'
    + '.mx2-seclink:hover{color:var(--ink,#18181b)}'
    + '.mx2-secdot{color:var(--faint,#a1a1aa);font-size:12px}'
    // --- Caça à Ruminação ---
    + '.adp-rum{margin-top:20px;padding-top:20px;border-top:1px solid var(--line,#d4d4d8)}'
    + '.adp-rum .rh{display:flex;align-items:center;gap:8px;font-weight:700;font-size:14.5px}'
    + '.adp-rum .rsub{font-size:13px;color:var(--muted,#71717a);margin:6px 0 14px;line-height:1.55;max-width:64ch}'
    + '.adp-rum .rbtn{display:inline-flex;align-items:center;gap:8px;font-weight:700;font-size:13.5px;padding:10px 18px;border-radius:999px;border:1.5px solid var(--ink,#18181b);color:var(--ink,#18181b);background:none;cursor:pointer}'
    + '.adp-rum .rbtn:hover{background:var(--ink,#18181b);color:#fff}'
    + '.adp-rum .rbtn[disabled]{opacity:.5;cursor:not-allowed}'
    + '.adp-rum .rout{margin-top:14px;display:none}'
    + '.adp-rum .rlbl{font-size:12px;font-weight:700;color:var(--muted,#71717a);margin:14px 0 8px;letter-spacing:.02em}'
    + '.adp-rum .rchip{display:block;width:100%;text-align:left;border:1px solid var(--line,#d4d4d8);border-radius:10px;padding:11px 14px;margin-bottom:8px;font-size:14px;color:#3f3f46;background:#fff;cursor:pointer;line-height:1.4}'
    + '.adp-rum .rchip:hover{border-color:var(--ink,#18181b)}'
    + '.adp-rum .rcentral{display:block;width:100%;text-align:left;border:1.5px solid var(--pink,#ff00d7);border-radius:10px;padding:12px 14px;font-size:15px;font-weight:700;color:var(--ink,#18181b);background:rgba(255,0,215,.04);cursor:pointer;line-height:1.4}'
    + '.adp-rum .rmsg{font-size:13px;color:var(--muted,#71717a);margin-top:10px;line-height:1.5}'
    + '.adp-rum .spin{display:inline-block;width:12px;height:12px;border:2px solid currentColor;border-right-color:transparent;border-radius:50%;animation:adpspin .7s linear infinite;vertical-align:-1px;margin-right:8px}'
    + '@keyframes adpspin{to{transform:rotate(360deg)}}'
    // --- Matriz responsiva no mobile: empilha a nota abaixo da pergunta (cabe em 390px) ---
    + '@media(max-width:640px){'
    +   '.mx-rtop{flex-direction:column;align-items:stretch;gap:10px}'
    +   '.mx-ctrl{align-items:flex-start}'
    +   '.mx-nota{flex-wrap:wrap}'
    +   '.mx-eixohd{flex-wrap:wrap;row-gap:8px}'
    +   '.mx-eixohd .et{white-space:normal}'
    +   '.mx-cand-h{flex-wrap:wrap;row-gap:6px}'
    +   '.mx-row{padding:14px 14px}'
    +   '.mx-evstrip{flex-wrap:wrap;row-gap:4px}'
    + '}';

  function ensureStyle() {
    if (document.getElementById('adp-canvas-style')) return;
    var s = document.createElement('style'); s.id = 'adp-canvas-style'; s.textContent = STYLE;
    document.head.appendChild(s);
  }

  function debounce(fn, ms) { var t; return function () { var a = arguments, c = this; clearTimeout(t); t = setTimeout(function () { fn.apply(c, a); }, ms); }; }

  // salva com feedback visual
  function doSave(block, data, statusEl, onSaved) {
    if (window.ADP && window.ADP.devMode) { if (statusEl) statusEl.textContent = 'salvo (dev)'; if (onSaved) onSaved(block, data); return; }
    window.ADP.saveBlock(block, data).then(function () { if (statusEl) { statusEl.textContent = 'salvo ✓'; statusEl.classList.remove('err'); } if (onSaved) onSaved(block, data); })
      .catch(function () { if (statusEl) { statusEl.textContent = 'não salvou — edite qualquer campo pra tentar de novo'; statusEl.classList.add('err'); } });
  }
  function makeSaver(block, statusEl, onSaved) {
    return debounce(function (getData) { doSave(block, getData(), statusEl, onSaved); }, 700);
  }

  function renderFields(container, def, data, onSaved) {
    var html = def.fields.map(function (f) {
      return '<div class="adp-fld"><label>' + esc(f.label) + '</label>'
        + '<div class="adp-hint">' + esc(f.ph) + '</div>'
        + '<textarea data-key="' + f.key + '" placeholder="Escreva aqui…">' + esc(data[f.key] != null ? data[f.key] : '') + '</textarea></div>';
    }).join('');
    container.innerHTML = html + '<div class="adp-savest"></div>';
    var tas = container.querySelectorAll('textarea[data-key]');
    var st = container.querySelector('.adp-savest');
    var save = makeSaver(def.block, st, onSaved);
    function gather() { var o = {}; tas.forEach(function (t) { o[t.dataset.key] = t.value; }); return o; }
    tas.forEach(function (t) {
      t.addEventListener('input', function () { if (st) st.textContent = '…'; save(gather); });
      t.addEventListener('blur', function () { doSave(def.block, gather(), st, onSaved); }); // flush ao sair do campo
    });
  }

  function renderMatrix(container, data, onSaved) {
    var rows = (data && data.rows && data.rows.length) ? data.rows.map(normRow) : [normRow(), normRow()];
    var openIdx = 0; // acordeão: só um candidato aberto por vez
    var editing = null; // "i:k" da evidência em edição (abre o textarea + revela a confiança)
    var NOTE_OK = 'Você não precisa acertar de primeira. Escolha a direção que mais faz sentido com o que você conhece hoje — usa, edita ou troca à vontade.';
    container.innerHTML = '<p class="mx-note" id="mxNote" style="font-size:13px;color:var(--muted,#71717a);line-height:1.5;margin:0 0 16px;padding-bottom:10px;border-bottom:1px solid var(--line,#d4d4d8)">' + NOTE_OK + '</p>'
      + '<div class="adp-mx"></div>'
      + '<button type="button" class="adp-addcand">Nenhuma dessas faz sentido? Criar outra hipótese</button>'
      + '<div class="adp-savest" style="display:none"></div>';
    var mx = container.querySelector('.adp-mx');
    var st = container.querySelector('.adp-savest');
    var save = makeSaver(2, st, onSaved);
    var mxNote = container.querySelector('#mxNote');
    var HIPBTN = 'background:none;border:0;color:var(--ink,#18181b);font-weight:700;text-decoration:underline;cursor:pointer;font:inherit;padding:0';
    function anyName() { return rows.some(function (r) { return (r.name || '').trim(); }); }
    // Gera 2 hipóteses da matéria-prima (Bloco 0). Não regenera se já houver salva, não sobrescreve o que o aluno escreveu.
    function genHipoteses() {
      if (!(window.ADP && window.ADP.hipoteses)) return;
      if (mxNote) mxNote.textContent = 'Montando hipóteses com base nas suas respostas…';
      window.ADP.hipoteses().then(function (r) {
        var hs = (r && r.data && r.data.hipoteses) || [];
        if (mxNote) mxNote.textContent = NOTE_OK;
        if (!hs.length || anyName()) return; // sem base ou o aluno já digitou → não mexe
        for (var k = 0; k < Math.min(2, hs.length); k++) { if (rows[k]) rows[k].name = hs[k].nicho || hs[k].name || ''; }
        paint(); persist();
      }).catch(function () {
        if (mxNote) mxNote.innerHTML = 'Não consegui gerar agora. Você pode escrever uma hipótese ou tentar de novo. '
          + '<button type="button" class="mx-hipretry" style="' + HIPBTN + '">Tentar novamente</button>'
          + ' · <button type="button" class="mx-hipmanual" style="' + HIPBTN + '">Preencher manualmente</button>';
      });
    }
    if (!anyName()) genHipoteses(); // só gera quando NÃO existe nenhuma hipótese salva

    function notaOpts(sel) { var s = '<option value="">—</option>'; for (var i = 1; i <= 5; i++) s += '<option ' + (i === sel ? 'selected' : '') + '>' + i + '</option>'; return s; }
    function confOpts(sel) {
      return [['', 'conf.'], ['baixa', 'baixa'], ['media', 'média'], ['alta', 'alta']]
        .map(function (x) { return '<option value="' + x[0] + '"' + (x[0] === sel ? ' selected' : '') + '>' + x[1] + '</option>'; }).join('');
    }
    // stepper: um critério por vez. Ordem = mercado (4) depois você (3), agrupado por eixo.
    var STEP_ORDER = ['intensidade', 'urgencia', 'crescimento', 'poder', 'repertorio', 'acesso', 'aderencia'];
    var SEC = { mercado: 'Sobre o mercado', voce: 'Sobre você' };
    var C_ICON = {
      intensidade: '<path d="M13 2 4 14h7l-1 8 9-12h-7z"/>',
      urgencia: '<circle cx="12" cy="12" r="8"/><path d="M12 8v4l3 2"/>',
      crescimento: '<path d="M3 17l6-6 4 4 8-8"/><path d="M16 7h5v5"/>',
      poder: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7v10"/><path d="M14.4 9.3A2.4 2 0 0 0 12 8.4c-1.4 0-2.4.7-2.4 1.8s1 1.6 2.4 1.8 2.4.7 2.4 1.8-1 1.8-2.4 1.8a2.4 2 0 0 1-2.4-1"/>',
      repertorio: '<circle cx="12" cy="8" r="3.2"/><path d="M5.5 20a6.5 6.5 0 0 1 13 0"/>',
      acesso: '<circle cx="7" cy="9" r="2.4"/><circle cx="17" cy="9" r="2.4"/><path d="M3.5 19a3.8 3.8 0 0 1 7 0M13.5 19a3.8 3.8 0 0 1 7 0"/>',
      aderencia: '<path d="M7 4h10v4a5 5 0 0 1-10 0z"/><path d="M9.5 15h5M12 12v8"/>'
    };
    function critNota(row, k) { return +(row.cells[k] && row.cells[k].nota) || 0; }
    function critEixo(k) { return CRITDEF[k].eixo; }
    function firstUnanswered(row) { for (var i = 0; i < STEP_ORDER.length; i++) { if (critNota(row, STEP_ORDER[i]) < 1) return STEP_ORDER[i]; } return null; }
    function activeKey(row) { if (row._active && STEP_ORDER.indexOf(row._active) >= 0) return row._active; return firstUnanswered(row); }

    // critério já respondido → linha compacta (nome · nota · explicar). Editando a evidência → textarea inline.
    function doneRowHTML(row, i, k) {
      var cell = row.cells[k], has = !!(cell.ev && cell.ev.trim());
      if (editing === i + ':' + k) {
        return '<div class="mx2-expl" data-i="' + i + '" data-k="' + k + '">'
          + '<textarea class="mx-ev" data-i="' + i + '" data-k="' + k + '" rows="2" placeholder="Por que essa nota? Um fato concreto (número, caso, data) deixa a nota mais forte.">' + esc(cell.ev || '') + '</textarea></div>';
      }
      return '<div class="mx2-done" data-i="' + i + '" data-k="' + k + '">'
        + '<span class="di"><svg viewBox="0 0 24 24">' + (C_ICON[k] || '') + '</svg></span>'
        + '<span class="dn" data-i="' + i + '" data-k="' + k + '">' + esc(CRITDEF[k].h) + '</span>'
        + '<span class="dv">' + critNota(row, k) + '/5</span>'
        + '<span class="dx" data-i="' + i + '" data-k="' + k + '">' + (has ? 'contexto ✓' : 'explicar') + '</span>'
        + '</div>';
    }
    // critério ativo (o único aberto) — pergunta grande + notas 1-5
    function activeHTML(row, i, k) {
      var c = CRITDEF[k], nb = '';
      for (var v = 1; v <= 5; v++) nb += '<button type="button" class="mx2-nb' + (critNota(row, k) === v ? ' on' : '') + '" data-i="' + i + '" data-k="' + k + '" data-v="' + v + '">' + v + '</button>';
      return '<div class="mx2-active">'
        +   '<div class="mx2-ctitle">' + esc(c.h) + '</div>'
        +   '<div class="mx2-cq">' + esc(c.hint) + '</div>'
        +   '<div class="mx2-notes">' + nb + '</div>'
        + '</div>';
    }
    function dotsHTML(row, i) {
      var ak = activeKey(row);
      return STEP_ORDER.map(function (k) { var on = critNota(row, k) >= 1, cur = k === ak; return '<i class="' + (cur ? 'cur' : (on ? 'on' : '')) + '" data-i="' + i + '" data-k="' + k + '"></i>'; }).join('');
    }
    // o que está matando a hipótese + a direção de ajuste (aponta, não entrega nicho pronto)
    function weakDiag(row) {
      var p = nota(row, 'poder'), u = nota(row, 'urgencia'), ac = nota(row, 'acesso'), ad = nota(row, 'aderencia');
      var sm = somaEixo(row, 'mercado'), sv = somaEixo(row, 'voce');
      if (p >= 1 && p <= 2) return 'O poder de compra é o gargalo. Talvez o público esteja amplo ou pequeno demais — tenta focar quem já tem operação girando, mais volume ou ticket maior.';
      if (u >= 1 && u <= 2) return 'Falta urgência. Vê se dá pra mirar um momento em que essa dor aperta de verdade — não algo que o cliente empurra com a barriga.';
      if (ac >= 1 && ac <= 2 && ad >= 1 && ad <= 2) return 'Você está longe do decisor e sem prova. Escolhe um recorte onde você já tem rede ou algum caso pra mostrar.';
      if (sm >= 14 && sv <= 6) return 'O mercado é bom, mas você ainda não tem prova nem acesso aqui. Dá pra começar construindo um caso pequeno antes de apostar tudo.';
      if (sm <= 8 && sv >= 11) return 'Você conhece bem, mas o mercado é fraco. Vê se há um recorte com mais dor, mais urgência ou mais dinheiro em jogo.';
      return v0txt(row);
    }
    function v0txt(row) { return verdict(row).txt; }
    // veredito → DECISÃO. Só aparece com os 7 pontuados; o CTA muda conforme o resultado e o estado das outras hipóteses.
    function decisionHTML(row, i) {
      if (!isScored(row)) return '';
      var v = verdict(row), tag = v.tag;
      var titleMap = { ok: ['Boa direção para investigar', 'ok'], construcao: ['Vale investigar — com uma ressalva', 'mid'], confortavel: ['Zona confortável, mercado fraco', 'mid'], alerta: ['Tem um ponto de atenção', 'bad'], inviavel: ['Provavelmente não vale a pena', 'bad'], todo: ['Quase lá', 'mid'] };
      var tm = titleMap[tag] || ['Leitura pronta', 'mid'];
      var good = (tag === 'ok'), bad = (tag === 'inviavel');
      var guide = good ? v.txt : weakDiag(row);
      var others = [], j;
      for (j = 0; j < rows.length; j++) { if (j !== i && (rows[j].name || '').trim()) others.push(j); }
      var otherUnscored = others.filter(function (k) { return !isScored(rows[k]); });
      var primary, secondary = [];
      if (good) {
        primary = { act: 'continuar', label: 'Continuar →' };
        if (others.length) secondary.push({ act: 'switch', label: 'Comparar com a outra hipótese' });
      } else if (bad) {
        if (otherUnscored.length) { primary = { act: 'switch', label: 'Avaliar a outra hipótese →' }; secondary.push({ act: 'adjust', label: 'Ajustar esta hipótese' }); secondary.push({ act: 'continuar', label: 'Continuar mesmo assim' }); }
        else if (others.length) { primary = { act: 'adjust', label: 'Ajustar esta hipótese' }; secondary.push({ act: 'switch', label: 'Ver a outra hipótese' }); secondary.push({ act: 'add', label: 'Criar outra' }); secondary.push({ act: 'continuar', label: 'Continuar mesmo assim' }); }
        else { primary = { act: 'adjust', label: 'Ajustar esta hipótese' }; secondary.push({ act: 'add', label: 'Criar outra hipótese' }); secondary.push({ act: 'continuar', label: 'Continuar mesmo assim' }); }
      } else { // mediano
        if (otherUnscored.length) primary = { act: 'switch', label: 'Avaliar a outra hipótese →' };
        else if (others.length) primary = { act: 'switch', label: 'Comparar com a outra hipótese' };
        else primary = { act: 'continuar', label: 'Continuar mesmo assim →' };
        secondary.push({ act: 'adjust', label: 'Ajustar esta hipótese' });
        if (primary.act !== 'continuar') secondary.push({ act: 'continuar', label: 'Continuar mesmo assim' });
      }
      var prim = '<button type="button" class="mx2-cta" data-act="' + primary.act + '" data-i="' + i + '">' + esc(primary.label) + '</button>';
      var sec = secondary.length ? '<div class="mx2-secacts">' + secondary.map(function (s) { return '<button type="button" class="mx2-seclink" data-act="' + s.act + '" data-i="' + i + '">' + esc(s.label) + '</button>'; }).join('<span class="mx2-secdot">·</span>') + '</div>' : '';
      return '<div class="mx2-vd"><span class="vdi ' + tm[1] + '"></span><div class="vdt"><b>' + tm[0] + '</b><p>' + esc(guide) + '</p></div></div>'
        + '<div class="mx2-decide">' + prim + sec + '</div>';
    }
    // hipótese aberta = header (nome protagonista) + progresso + respondidos compactos + critério ativo + veredito
    function openHTML(row, i) {
      var ak = activeKey(row), multi = rows.length > 1;
      var dones = STEP_ORDER.filter(function (k) { return critNota(row, k) >= 1 && k !== ak; });
      var body = '';
      dones.forEach(function (k) { body += doneRowHTML(row, i, k); });
      if (ak) body += activeHTML(row, i, ak);
      var actions = '<button type="button" class="mx2-link mx2-editar" data-i="' + i + '">editar</button>'
        + '<button type="button" class="mx2-link mx2-trocar" data-i="' + i + '">trocar</button>'
        + (multi ? '<button type="button" class="mx2-link mx2-rm" data-i="' + i + '">remover</button>' : '')
        + (multi ? '<button type="button" class="mx2-link mx2-recolher" data-i="' + i + '">recolher</button>' : '');
      var lead = ak ? (SEC[critEixo(ak)] + ' · Critério ' + (STEP_ORDER.indexOf(ak) + 1) + ' de 7') : 'Todos os 7 critérios ✓';
      return '<div class="mx-cand" data-i="' + i + '">'
        + '<div class="mx2-head">'
        +   '<textarea class="mx-name" data-i="' + i + '" rows="1" placeholder="ex: clínicas de estética que precisam atrair cliente pelo digital">' + esc(row.name) + '</textarea>'
        +   '<div class="mx2-links">' + actions + '</div>'
        + '</div>'
        + '<div class="mx2-prog"><span class="mx2-progn">' + lead + '</span><span class="mx2-dots">' + dotsHTML(row, i) + '</span></div>'
        + body
        + decisionHTML(row, i)
        + '</div>';
    }
    // hipótese recolhida = barra resumida (ponto 5: "ainda não avaliada" / "Mercado X/20 · Afinidade Y/15")
    function barHTML(row, i) {
      var read;
      if (!anyScore(row)) read = 'não avaliada';
      else if (!isScored(row)) read = STEP_ORDER.filter(function (k) { return critNota(row, k) >= 1; }).length + ' de 7';
      else read = 'Mercado ' + somaEixo(row, 'mercado') + '/20 · Afinidade ' + somaEixo(row, 'voce') + '/15';
      var title = (row.name && row.name.trim()) ? esc(row.name) : ('Hipótese ' + (i + 1));
      return '<div class="mx-cbar" data-i="' + i + '">'
        + '<span class="mx-cbtitle">' + title + '</span>'
        + '<span class="mx-cbread">' + read + '</span>'
        + '<svg class="chev" viewBox="0 0 24 24"><path d="m6 9 6 6 6-6"/></svg></div>';
    }
    function paint() {
      mx.innerHTML = rows.map(function (row, i) {
        if (i !== openIdx && rows.length > 1) return barHTML(row, i);
        return openHTML(row, i);
      }).join('');
      // textareas crescem com o texto (nome da hipótese e evidência)
      Array.prototype.forEach.call(mx.querySelectorAll('.mx-name,.mx-ev'), function (t) { t.style.height = 'auto'; t.style.height = t.scrollHeight + 'px'; });
    }
    function matData() {
      return {
        rows: rows.map(function (r) {
          return { name: r.name, obs: r.obs, cells: r.cells, soma_mercado: somaEixo(r, 'mercado'), soma_voce: somaEixo(r, 'voce'), total: somaEixo(r, 'mercado') + somaEixo(r, 'voce'), veredito: verdict(r).txt };
        }),
        hipotese_principal: hipotesePrincipal(rows)
      };
    }
    function persist() { if (st) st.textContent = '…'; save(matData); }

    // digitar não re-renderiza (perderia o foco) — só atualiza o dado + cresce o textarea
    container.addEventListener('input', function (e) {
      var t = e.target, i = +t.dataset.i;
      if (t.classList.contains('mx-name')) { rows[i].name = t.value; t.style.height = 'auto'; t.style.height = t.scrollHeight + 'px'; persist(); }
      else if (t.classList.contains('mx-ev')) { var cc = rows[i].cells[t.dataset.k]; cc.ev = t.value; cc.conf = inferConf(t.value); t.style.height = 'auto'; t.style.height = t.scrollHeight + 'px'; persist(); }
    });
    container.addEventListener('click', function (e) {
      var el = e.target, cl = el.classList, i = +el.dataset.i;
      // falha da geração de hipóteses
      if (cl.contains('mx-hipretry')) { genHipoteses(); return; }
      if (cl.contains('mx-hipmanual')) { if (mxNote) mxNote.textContent = NOTE_OK; return; }
      // ações da decisão (veredito) — o CTA vira a próxima ação, não um "continuar" cego
      if (cl.contains('mx2-cta') || cl.contains('mx2-seclink')) {
        var act = el.dataset.act;
        if (act === 'continuar') { if (window.__matrizContinue) window.__matrizContinue(); return; }
        if (act === 'add') { rows.push(normRow()); openIdx = rows.length - 1; paint(); persist(); return; }
        if (act === 'adjust') { var nmA = container.querySelector('.mx-name[data-i="' + i + '"]'); if (nmA) { nmA.focus(); var LA = nmA.value.length; try { nmA.setSelectionRange(LA, LA); } catch (er) {} } return; }
        if (act === 'switch') {
          var target = -1, jj;
          for (jj = 0; jj < rows.length; jj++) { if (jj !== i && (rows[jj].name || '').trim() && !isScored(rows[jj])) { target = jj; break; } }
          if (target < 0) for (jj = 0; jj < rows.length; jj++) { if (jj !== i && (rows[jj].name || '').trim()) { target = jj; break; } }
          if (target < 0) for (jj = 0; jj < rows.length; jj++) { if (jj !== i) { target = jj; break; } }
          if (target >= 0) { openIdx = target; paint(); }
          return;
        }
        return;
      }
      // nota do critério ativo → registra e AVANÇA pro próximo não respondido
      if (cl.contains('mx2-nb')) { var k = el.dataset.k, v = +el.dataset.v, cell = rows[i].cells[k]; cell.nota = (cell.nota === v ? 0 : v); rows[i]._active = cell.nota ? firstUnanswered(rows[i]) : k; paint(); persist(); return; }
      // dot → pula pro critério
      if (el.tagName === 'I' && el.parentNode && el.parentNode.classList.contains('mx2-dots')) { rows[i]._active = el.dataset.k; paint(); return; }
      // revisar critério respondido (clica no nome)
      if (cl.contains('dn')) { rows[i]._active = el.dataset.k; paint(); return; }
      // explicar → abre o textarea da evidência
      if (cl.contains('dx')) { editing = i + ':' + el.dataset.k; paint(); var ta = container.querySelector('.mx-ev'); if (ta) { ta.focus(); var L = ta.value.length; try { ta.setSelectionRange(L, L); } catch (er) {} } return; }
      // editar nome
      if (cl.contains('mx2-editar')) { var nm = container.querySelector('.mx-name[data-i="' + i + '"]'); if (nm) { nm.focus(); var L2 = nm.value.length; try { nm.setSelectionRange(L2, L2); } catch (er) {} } return; }
      // trocar hipótese (limpa pra reescrever)
      if (cl.contains('mx2-trocar')) { rows[i].name = ''; paint(); persist(); var nm2 = container.querySelector('.mx-name[data-i="' + i + '"]'); if (nm2) nm2.focus(); return; }
      // remover
      if (cl.contains('mx2-rm')) { rows.splice(i, 1); if (!rows.length) rows.push(normRow()); if (openIdx >= rows.length) openIdx = rows.length - 1; if (openIdx < 0) openIdx = 0; paint(); persist(); return; }
      // recolher a aberta
      if (cl.contains('mx2-recolher')) { openIdx = -1; paint(); return; }
      // expandir barra recolhida
      var bar = el.closest ? el.closest('.mx-cbar') : null;
      if (bar) { openIdx = +bar.dataset.i; paint(); return; }
      // criar outra hipótese
      if (cl.contains('adp-addcand')) { rows.push(normRow()); openIdx = rows.length - 1; paint(); persist(); return; }
    });
    container.addEventListener('focusout', function (e) {
      // sair do textarea de evidência: salva, infere confiança, fecha e repinta (vira linha compacta)
      if (e.target && e.target.classList && e.target.classList.contains('mx-ev')) {
        var cell = rows[+e.target.dataset.i].cells[e.target.dataset.k];
        cell.ev = e.target.value; cell.conf = inferConf(e.target.value);
        editing = null; persist(); paint(); return;
      }
      doSave(2, matData(), st, onSaved);
    });
    paint();
  }

  // nicho campeão a partir dos dados do Bloco 2 (Matriz v2): melhor viável; fallback = melhor parcial não-inviável, senão 1º nomeado
  function nichoFromBlock2(data2) {
    if (!data2 || !data2.rows) return '';
    var rows = data2.rows.map(normRow);
    var w = champion(rows);
    if (w) return w.name;
    var named = rows.filter(function (r) { return (r.name || '').trim(); });
    if (!named.length) return '';
    var notInv = named.filter(function (r) { return verdict(r).tag !== 'inviavel'; });
    var pool = notInv.length ? notInv : named;
    pool.sort(function (a, b) { return (somaEixo(b, 'mercado') + somaEixo(b, 'voce')) - (somaEixo(a, 'mercado') + somaEixo(a, 'voce')); });
    return pool[0].name;
  }

  // pronta pra seguir = pelo menos UMA hipótese com os 7 critérios pontuados
  function matrizReady(data2) {
    if (!data2 || !data2.rows) return false;
    return data2.rows.map(normRow).some(function (r) { return (r.name || '').trim() && isScored(r); });
  }
  // quantos critérios faltam na hipótese mais avançada (pro "Faltam N critérios")
  function matrizRemaining(data2) {
    if (!data2 || !data2.rows) return CRIT7.length;
    var named = data2.rows.map(normRow).filter(function (r) { return (r.name || '').trim(); });
    if (!named.length) return CRIT7.length;
    var best = Math.max.apply(null, named.map(function (r) { return CRIT7.filter(function (c) { return nota(r, c.k) >= 1; }).length; }));
    return Math.max(0, CRIT7.length - best);
  }

  // quão preenchido está um bloco (0..1) — pros pontinhos ●●●○○ do dashboard/cards
  function blockCompletion(block, data) {
    if (!data) return 0;
    if (block === 2) {
      var rows = (data.rows || []).map(normRow).filter(function (r) { return (r.name || '').trim(); });
      if (!rows.length) return 0;
      var ratios = rows.map(function (r) { return CRIT7.filter(function (c) { return nota(r, c.k) >= 1; }).length / CRIT7.length; });
      return Math.max.apply(null, ratios);
    }
    var def = byBlock(block);
    if (!def || !def.fields) return isFilled(block, data) ? 1 : 0;
    var filled = def.fields.filter(function (f) { var v = data[f.key]; return v && String(v).trim(); }).length;
    return filled / def.fields.length;
  }

  // estado de UM bloco pro dashboard/cards: Conclusão (preenchido+completion) · Gate (severidade) · Validação.
  // Os 3 eixos separados — nunca um selo só (ver ARQ 1/ARQ 3).
  function gateForBlock(block, data) {
    var preenchido = isFilled(block, data);
    var res = { preenchido: preenchido, completion: blockCompletion(block, data), gate: { sev: 'nenhum', label: '' }, validacao: preenchido ? 'hipotese' : '' };
    if (!preenchido) return res;
    var d = data || {};
    function has(v) { return v != null && String(v).trim() !== ''; }
    if (block === 0) {
      // formato rico (Escavador) distingue PROVA de competência; formato antigo (campos planos) não dá — cai no fallback
      var rich = Array.isArray(d.comunidades) || Array.isArray(d.competencias) || Array.isArray(d.provas);
      if (rich) {
        var hasComu = (d.comunidades || []).some(function (c) { return c && has(c.nome); });
        var hasComp = (d.competencias || []).some(function (c) { return c && has(c.o_que); });
        var hasProva = (d.provas || []).some(function (p) { return p && (has(p.consequencia) || has(p.situacao)); });
        if (!hasComu && !hasComp && !hasProva) res.gate = { sev: 'critico', label: 'sem matéria-prima' };
        else if (!hasProva) res.gate = { sev: 'importante', label: 'falta prova concreta' };
        else if (!has(d.historia)) res.gate = { sev: 'aviso', label: 'história fraca' };
        else res.gate = { sev: 'ok', label: 'base sólida' };
      } else {
        if (!has(d.forte) && !has(d.mundos)) res.gate = { sev: 'critico', label: 'sem matéria-prima' };
        else if (!has(d.forte)) res.gate = { sev: 'importante', label: 'sem prova concreta' };
        else if (!has(d.historia)) res.gate = { sev: 'aviso', label: 'história fraca' };
        else res.gate = { sev: 'ok', label: 'matéria-prima ok' };
      }
    } else if (block === 2) {
      var rows = (d.rows || []).map(normRow).filter(function (r) { return (r.name || '').trim(); });
      if (!rows.length) res.gate = { sev: 'critico', label: 'sem candidato a nicho' };
      else {
        var anyEv = rows.some(function (r) { return CRIT7.some(function (c) { return (r.cells[c.k].ev || '').trim(); }); });
        var champ = champion(rows);
        if (!anyEv) res.gate = { sev: 'critico', label: 'matriz sem evidência' };
        else if (!champ) res.gate = { sev: 'importante', label: 'falta o nicho passar nos dois lados (mercado e você)' };
        else if (avgConf(champ) < 1) res.gate = { sev: 'importante', label: 'confiança baixa' };
        else res.gate = { sev: 'ok', label: 'nicho com evidência' };
      }
    } else if (block === 3) {
      if (!has(d.ideal) || !has(d.dor)) res.gate = { sev: 'critico', label: !has(d.ideal) ? 'sem cliente ideal' : 'sem dor' };
      else if (!has(d.desejo)) res.gate = { sev: 'aviso', label: 'sem desejo do cliente' };
      else res.gate = { sev: 'ok', label: 'cliente e dor definidos' };
    } else if (block === 4) {
      if (!has(d.diferencial) && !has(d.frase)) res.gate = { sev: 'critico', label: 'sem diferencial nem frase' };
      else if (!has(d.metodo) || !has(d.prova)) res.gate = { sev: 'importante', label: !has(d.metodo) ? 'sem método' : 'sem prova' };
      else res.gate = { sev: 'ok', label: 'monopólio sustentado' };
    }
    return res;
  }

  // 🧠 Caça à Ruminação — anexa ao Bloco 3. Usa o nicho (opts.getNicho) + o cliente digitado.
  function appendRuminacao(container, opts) {
    var wrap = document.createElement('div');
    wrap.className = 'adp-rum';
    wrap.innerHTML = '<div class="rh">🧠 Caça à Ruminação</div>'
      + '<p class="rsub">Não sabe a dor do teu cliente? A IA acha as ruminações mais prováveis do dono do teu nicho — em 1ª pessoa. Clica na que mais bate pra jogar no campo da dor. (Depois confirma no campo: reviews 1★, grupos, autocomplete do Google.)</p>'
      + '<button class="rbtn" type="button">Rodar a Caça à Ruminação</button><div class="rout"></div>';
    container.appendChild(wrap);
    var btn = wrap.querySelector('.rbtn');
    var out = wrap.querySelector('.rout');
    btn.addEventListener('click', async function () {
      var nicho = (opts && opts.getNicho && opts.getNicho()) || '';
      var idealEl = container.querySelector('textarea[data-key="ideal"]');
      var interEl = container.querySelector('textarea[data-key="intermediario"]');
      var cliente = [idealEl && idealEl.value, interEl && interEl.value].filter(Boolean).join(' | ');
      if (!nicho) { out.style.display = 'block'; out.innerHTML = '<p class="rmsg">Escolhe teu nicho na <a href="canvas.html" style="color:var(--pink,#ff00d7);text-decoration:underline">Matriz (Bloco 2)</a> primeiro — a Caça precisa saber de qual dono estamos falando.</p>'; return; }
      btn.disabled = true; out.style.display = 'block'; out.innerHTML = '<p class="rmsg"><span class="spin"></span>Caçando as ruminações do dono…</p>';
      try {
        var r = await window.ADP.ruminacao(nicho, cliente);
        renderRumResult(out, (r && r.data) ? r.data : r, container);
      } catch (e) { out.innerHTML = '<p class="rmsg">' + esc(e.message || 'Não consegui rodar agora. Tenta de novo.') + '</p>'; }
      btn.disabled = false;
    });
  }

  function renderRumResult(out, d, container) {
    if (!d || (!d.ruminacoes && !d.dor_central)) { out.innerHTML = '<p class="rmsg">A IA não devolveu nada útil. Tenta de novo.</p>'; return; }
    var rums = d.ruminacoes || [];
    var html = '';
    if (d.dor_central) html += '<div class="rlbl">A dor central (clica pra usar)</div><button type="button" class="rcentral" data-dor="' + esc(d.dor_central) + '">' + esc(d.dor_central) + '</button>';
    if (rums.length) html += '<div class="rlbl">Outras ruminações (clica pra usar como a tua)</div>' + rums.map(function (x) { return '<button type="button" class="rchip" data-dor="' + esc(x) + '">' + esc(x) + '</button>'; }).join('');
    if (d.porque) html += '<p class="rmsg">' + esc(d.porque) + '</p>';
    out.innerHTML = html;
    Array.prototype.forEach.call(out.querySelectorAll('[data-dor]'), function (b) {
      b.addEventListener('click', function () {
        var dorEl = container.querySelector('textarea[data-key="dor"]');
        if (dorEl) { dorEl.value = this.getAttribute('data-dor'); dorEl.dispatchEvent(new Event('input', { bubbles: true })); dorEl.focus(); }
      });
    });
  }

  // renderiza o editor de UM bloco dentro de container. data = objeto salvo desse bloco (ou {}).
  function renderBlock(container, blockNum, data, onSaved, opts) {
    ensureStyle();
    var def = byBlock(blockNum);
    if (!def) { container.innerHTML = ''; return; }
    data = data || {};
    if (def.type === 'matrix') { renderMatrix(container, data, onSaved); return; }
    renderFields(container, def, data, onSaved);
    if (blockNum === 3) appendRuminacao(container, opts || {});
  }

  return { BLOCKS: BLOCKS, byBlock: byBlock, isFilled: isFilled, renderBlock: renderBlock, nichoFromBlock2: nichoFromBlock2, matrizReady: matrizReady, matrizRemaining: matrizRemaining, gateForBlock: gateForBlock, blockCompletion: blockCompletion };
})();
