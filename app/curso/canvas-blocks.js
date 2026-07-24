// Fonte única dos blocos do Canvas. Usado inline na aula E na tela Meu Canvas.
// Cada bloco = matéria-prima que o Estrategista lê no final.
// Salva via window.ADP.saveBlock(block, data) e carrega via window.ADP.loadCanvas().
window.ADP_CANVAS = (function () {
  // Matriz v2 — 2 eixos, 7 critérios. Cada nota (1-5) leva EVIDÊNCIA + CONFIANÇA. Sem soma ponderada: dois totais por eixo + regras de inviabilidade.
  var EIXOS = [
    { key: 'mercado', h: 'Mercado', max: 20, crit: [
      { k: 'intensidade', h: 'Intensidade',      hint: 'A dor é forte de verdade — ou só "seria bom ter"?' },
      { k: 'urgencia',    h: 'Urgência',         hint: 'Resolve AGORA ou dá pra empurrar? Sem urgência, o mercado elogia e não compra.' },
      { k: 'crescimento', h: 'Crescimento',      hint: 'Esse mercado cresce, estabiliza ou encolhe?' },
      { k: 'poder',       h: 'Poder de compra',  hint: 'Tem verba e decide gastar com isso? Sem poder de compra, mata o nicho.' }
    ]},
    { key: 'voce', h: 'Você', max: 15, crit: [
      { k: 'repertorio', h: 'Repertório',       hint: 'Você já conhece esse mundo por dentro?' },
      { k: 'acesso',     h: 'Acesso',           hint: 'Consegue chegar no decisor em 30 dias (rede, conteúdo, prospecção)?' },
      { k: 'aderencia',  h: 'Aderência / Prova', hint: 'Você já tem caso ou prova que gruda nesse nicho?' }
    ]}
  ];
  var CRIT7 = EIXOS.reduce(function (a, e) { return a.concat(e.crit.map(function (c) { return { k: c.k, eixo: e.key, h: c.h, hint: c.hint }; })); }, []);
  var CRITDEF = {}; CRIT7.forEach(function (c) { CRITDEF[c.k] = c; });
  var CONF_W = { alta: 2, media: 1, baixa: 0 };

  var BLOCKS = [
    { block: 0, title: 'Sobre você', type: 'fields', fields: [
      { key: 'mundos',   label: 'Mundos que você já conhece por dentro', ph: 'Trampo antigo, negócio da família, hobby, paixão — mercados que você já vive.' },
      { key: 'forte',    label: 'O que sai fácil e onde você já tem prova', ph: 'O projeto que sai quase no automático — e pra que tipo de cliente você já tem trabalho pra mostrar.' },
      { key: 'turmas',   label: 'Suas turmas e comunidades',              ph: 'Academia, futebol, RPG, igreja, trampo antigo, pais de pet… onde esse tipo de dono se encontra.' },
      { key: 'historia', label: 'Sua história',                           ph: 'De onde você veio e por que faz o que faz do jeito que faz. O que só você tem.' }
    ]},
    { block: 1, title: 'O inimigo (seus medos)', type: 'fields', fields: [
      { key: 'segura',       label: 'O que te segura no genérico',        ph: 'Qual medo te trava pra nichar? Manda sem filtro — medo no papel encolhe.' },
      { key: 'visibilidade', label: 'Como teu cliente ideal te acharia hoje?', ph: 'Hoje, quantos cliques até alguém chegar em você? Sem maquiar.' }
    ]},
    { block: 2, title: 'A Matriz do Nicho', type: 'matrix' },
    { block: 3, title: 'Quem você atende (a dor)', type: 'fields', fields: [
      { key: 'nao',           label: 'Quem eu NÃO atendo (obrigatório)',  ph: 'Quem você recusa. Começa por aqui — posicionamento é dizer não.' },
      { key: 'ideal',         label: 'Cliente ideal — situação e dor',    ph: 'Não idade e CEP. A situação que ele vive e a dor que o mantém acordado.' },
      { key: 'intermediario', label: 'Cliente intermediário',             ph: 'Serve, mas não é o sonho.' },
      { key: 'dor',           label: 'A dor-loop principal',              ph: 'A vozinha que não cala na cabeça dele. Roda a Caça à Ruminação se travar.' },
      { key: 'desejo',        label: 'O que ele quer no lugar (o desejo)',ph: 'Não a dor — o estado que ele quer alcançar. Pra onde ele quer chegar quando a dor sumir.' }
    ]},
    { block: 4, title: 'Seu monopólio', type: 'fields', fields: [
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
    + '.adp-fld label{display:block;font-size:16px;font-weight:700;color:var(--ink,#18181b);margin-bottom:9px;letter-spacing:-.01em;line-height:1.4}'
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
    + '.mx-cand-h{display:flex;align-items:center;gap:11px;padding:2px 4px 0}'
    + '.mx-lead{font-weight:700;font-size:15px;flex:none;color:var(--ink,#18181b)}'
    + '.mx-name{flex:1;min-width:110px;border:none;border-bottom:1px solid transparent;background:transparent;font:inherit;font-weight:700;font-size:15px;color:var(--ink,#18181b);padding:2px 0}'
    + '.mx-name::placeholder{color:var(--faint,#a1a1aa);font-weight:400}'
    + '.mx-name:hover{border-bottom-color:var(--line,#d4d4d8)}'
    + '.mx-name:focus{outline:none;border-bottom-color:var(--ink,#18181b)}'
    + '.mx-state{flex:none;font-size:11px;font-weight:700;padding:4px 11px;border-radius:999px}'
    + '.mx-state.s-ok{background:var(--lime,#e7f99a);color:var(--ink,#18181b)}'
    + '.mx-state.s-mid{background:var(--soft,#e6e6e8);color:var(--muted,#71717a)}'
    + '.mx-state.s-bad{background:var(--ink,#18181b);color:#fff}'
    + '.mx-del{flex:none;font-size:12px;color:var(--muted,#71717a);text-decoration:underline;cursor:pointer;background:none;border:none;padding:2px}'
    + '.mx-del:hover{color:var(--ink,#18181b)}'
    // eixo = módulo (igual .module da HOME)
    + '.mx-eixomod{background:var(--card,transparent);border:1px solid var(--line,#d4d4d8);border-radius:12px;overflow:hidden}'
    + '.mx-eixohd{display:flex;align-items:center;gap:12px;padding:12px 18px;background:var(--soft,#e6e6e8)}'
    + '.mx-eixohd .et{font-size:13.5px;font-weight:700;color:var(--ink,#18181b);flex:none}'
    + '.mx-eixohd .etrack{flex:1;height:5px;border-radius:999px;background:rgba(16,16,16,.09);overflow:hidden;min-width:40px}'
    + '.mx-eixohd .etrack i{display:block;height:100%;background:var(--lime,#e7f99a);border-radius:999px;transition:width .3s}'
    + '.mx-eixohd .en{font-size:12.5px;font-weight:700;color:var(--ink,#18181b);flex:none}'
    // linha de critério = .lesson
    + '.mx-row{display:flex;align-items:center;gap:14px;padding:12px 18px;border-top:1px solid var(--line,#d4d4d8)}'
    + '.mx-c1{flex:1;min-width:0}'
    + '.mx-c1 .n{font-size:14px;font-weight:700;color:var(--ink,#18181b);line-height:1.25}'
    + '.mx-c1 .q{font-size:12px;color:var(--muted,#71717a);margin-top:2px;line-height:1.35}'
    + '.mx-c1 .mx-evline{margin-top:7px}'
    // controles à direita: NOTA em cima (destaque) · confiança embaixo (menor/apagada)
    + '.mx-ctrl{flex:none;display:flex;flex-direction:column;align-items:flex-end;gap:5px}'
    + '.mx-nota{display:inline-flex;align-items:baseline;gap:8px}'
    + '.mx-nn{min-width:13px;text-align:center;border:none;background:none;font:inherit;font-weight:700;font-size:13px;color:var(--faint,#a1a1aa);cursor:pointer;line-height:1;padding:0;transition:color .12s,font-size .12s}'
    + '.mx-nn:hover{color:var(--muted,#71717a)}'
    + '.mx-nn.on{font-size:19px;color:var(--ink,#18181b)}'
    + '.mx-confrow{display:inline-flex;align-items:baseline;gap:5px;font-size:10px;font-weight:700;letter-spacing:.04em;text-transform:uppercase;color:var(--faint,#a1a1aa)}'
    + '.mx-confsel{font:inherit;font-size:11px;font-weight:700;letter-spacing:0;text-transform:none;color:var(--muted,#71717a);background:none;border:none;border-bottom:1px solid var(--line,#d4d4d8);padding:1px 1px;cursor:pointer}'
    + '.mx-confsel:focus{outline:none;border-color:var(--ink,#18181b)}'
    + '.mx-evline{margin-top:7px}'
    + '.mx-evbtn{display:inline-flex;align-items:center;gap:6px;max-width:100%;font:inherit;font-size:11.5px;color:var(--faint,#a1a1aa);background:none;border:none;cursor:pointer;text-align:left;padding:0}'
    + '.mx-evbtn .ei{width:11px;height:11px;flex:none;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}'
    + '.mx-evbtn:hover{color:var(--ink,#18181b)}'
    + '.mx-evbtn.has{display:flex;min-width:0;color:var(--muted,#71717a)}'
    + '.mx-evbtn.has b{color:var(--ink,#18181b);font-weight:700;flex:none}'
    + '.mx-evbtn.has .tx{color:#3f3f46;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}'
    + '.mx-ev{width:100%;border:1px solid var(--line,#d4d4d8);border-radius:8px;background:transparent;font:inherit;font-size:12px;padding:8px 9px;color:#3f3f46;resize:none;min-height:40px;line-height:1.4}'
    + '.mx-ev::placeholder{color:var(--faint,#a1a1aa)}'
    + '.mx-ev:focus{outline:none;border-color:var(--ink,#18181b)}'
    + '.mx-vd{padding:4px 4px 2px;font-size:13px;color:var(--ink,#18181b);display:flex;align-items:baseline;gap:9px;line-height:1.45}'
    + '.mx-vd .dot{width:7px;height:7px;border-radius:999px;flex:none;align-self:center}'
    + '.mx-vd .dot.ok{background:var(--lime,#e7f99a)}.mx-vd .dot.mid{background:var(--faint,#a1a1aa)}.mx-vd .dot.bad{background:var(--ink,#18181b)}'
    + '.mx-vd .vl{font-weight:700;flex:none}'
    + '.mx-vd .vx{color:#3f3f46;min-width:0}'
    + '.adp-addcand{margin-top:4px;font-size:13px;font-weight:700;color:var(--ink,#18181b);border:1px solid var(--line,#d4d4d8);border-radius:10px;padding:11px 14px;width:100%;cursor:pointer;background:none}'
    + '.adp-addcand:hover{background:var(--soft,#e6e6e8)}'
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
    + '@keyframes adpspin{to{transform:rotate(360deg)}}';

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
        + '<textarea data-key="' + f.key + '" placeholder="' + esc(f.ph) + '">' + esc(data[f.key] != null ? data[f.key] : '') + '</textarea></div>';
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
    container.innerHTML = '<div class="adp-mx"></div>'
      + '<button type="button" class="adp-addcand">+ candidato a nicho</button>'
      + '<div class="adp-savest" style="display:none"></div>';
    var mx = container.querySelector('.adp-mx');
    var st = container.querySelector('.adp-savest');
    var save = makeSaver(2, st, onSaved);

    function notaOpts(sel) { var s = '<option value="">—</option>'; for (var i = 1; i <= 5; i++) s += '<option ' + (i === sel ? 'selected' : '') + '>' + i + '</option>'; return s; }
    function confOpts(sel) {
      return [['', 'conf.'], ['baixa', 'baixa'], ['media', 'média'], ['alta', 'alta']]
        .map(function (x) { return '<option value="' + x[0] + '"' + (x[0] === sel ? ' selected' : '') + '>' + x[1] + '</option>'; }).join('');
    }
    // ordem de exibição (mercado/você intercalados) + ícone de cada critério
    var CRIT_ORDER = ['intensidade', 'repertorio', 'urgencia', 'acesso', 'crescimento', 'poder', 'aderencia'];
    var CRIT_ICON = {
      intensidade: '<path d="M13 2 4 14h7l-1 8 9-12h-7z"/>',
      repertorio: '<circle cx="12" cy="8" r="3.2"/><path d="M5.5 20a6.5 6.5 0 0 1 13 0"/>',
      urgencia: '<circle cx="12" cy="12" r="8"/><path d="M12 8v4l3 2"/>',
      acesso: '<circle cx="7" cy="9" r="2.4"/><circle cx="17" cy="9" r="2.4"/><path d="M3.5 19a3.8 3.8 0 0 1 7 0M13.5 19a3.8 3.8 0 0 1 7 0"/>',
      crescimento: '<path d="M3 17l6-6 4 4 8-8"/><path d="M16 7h5v5"/>',
      poder: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7v10M14.4 9.3A2.4 2 0 0 0 12 8.4c-1.4 0-2.4.7-2.4 1.8s1 1.6 2.4 1.8 2.4.7 2.4 1.8-1 1.8-2.4 1.8a2.4 2 0 0 1-2.4-1"/>',
      aderencia: '<path d="M7 4h10v4a5 5 0 0 1-10 0z"/><path d="M7 6H4.5v.8a3 3 0 0 0 3 3M17 6h2.5v.8a3 3 0 0 1-3 3M9.5 15h5M10.5 20h3M12 15v5"/>'
    };
    var COL_META = {
      mercado: { label: 'O mercado vale a pena?', hint: 'Dor forte, urgência e quem paga.' },
      voce: { label: 'Você tem vantagem aqui?', hint: 'Conhece por dentro, tem acesso e prova.' }
    };
    var STAR = '<svg viewBox="0 0 24 24"><path d="M12 3l2.5 5.5L20 9.3l-4 3.9.9 5.8L12 16.2 7.1 19l.9-5.8-4-3.9 5.5-.8z"/></svg>';
    // evidência = linha compacta que abre pra editar (nada de caixão cinza sempre aberto)
    function evLineHTML(i, k, cell) {
      if (cell.ev && cell.ev.trim()) {
        return '<button type="button" class="mx-evbtn has" data-i="' + i + '" data-k="' + k + '"><svg viewBox="0 0 24 24" class="ei"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/></svg><b>Evidência:</b>&nbsp;<span class="tx">' + esc(cell.ev) + '</span></button>';
      }
      return '<button type="button" class="mx-evbtn" data-i="' + i + '" data-k="' + k + '"><svg viewBox="0 0 24 24" class="ei"><path d="M12 5v14M5 12h14"/></svg>Adicionar evidência</button>';
    }
    // critério = LINHA (sem card, sem ícone): nome+pergunta à esquerda, nota (chips pretos) + confiança secundária à direita
    function critRowHTML(row, i, k) {
      var c = CRITDEF[k], cell = row.cells[k], n = '';
      // nota: 1–5 discretos, o escolhido cresce e fica preto (é o próprio seletor, sem caixa)
      for (var v = 1; v <= 5; v++) n += '<button type="button" class="mx-nn' + (cell.nota === v ? ' on' : '') + '" data-i="' + i + '" data-k="' + k + '" data-v="' + v + '">' + v + '</button>';
      // confiança: select secundário, embaixo da nota (peso menor)
      var conf = [['', '—'], ['baixa', 'baixa'], ['media', 'média'], ['alta', 'alta']].map(function (x) {
        return '<option value="' + x[0] + '"' + (cell.conf === x[0] ? ' selected' : '') + '>' + x[1] + '</option>';
      }).join('');
      return '<div class="mx-row">'
        + '<div class="mx-c1"><div class="n">' + esc(c.h) + '</div><div class="q">' + esc(c.hint) + '</div>'
        +   '<div class="mx-evline" data-i="' + i + '" data-k="' + k + '">' + evLineHTML(i, k, cell) + '</div></div>'
        + '<div class="mx-ctrl"><span class="mx-nota">' + n + '</span>'
        +   '<span class="mx-confrow">confiança <select class="mx-confsel" data-i="' + i + '" data-k="' + k + '">' + conf + '</select></span></div>'
        + '</div>';
    }
    function eixoHTML(row, i, eixo) {
      var m = COL_META[eixo.key], soma = somaEixo(row, eixo.key), pct = Math.round(soma / eixo.max * 100);
      return '<div class="mx-eixomod">'
        + '<div class="mx-eixohd"><span class="et">' + m.label + '</span><span class="etrack"><i style="width:' + pct + '%"></i></span><span class="en">' + soma + '/' + eixo.max + '</span></div>'
        + eixo.crit.map(function (c) { return critRowHTML(row, i, c.k); }).join('')
        + '</div>';
    }
    // estado resumido do candidato (chip do header)
    function stateChip(row) {
      if (!anyScore(row)) return { cls: 's-mid', txt: 'em avaliação' };
      var t = verdict(row).tag;
      if (t === 'ok') return { cls: 's-ok', txt: 'promissor' };
      if (t === 'inviavel') return { cls: 's-bad', txt: 'inviável' };
      if (t === 'todo') return { cls: 's-mid', txt: 'em avaliação' };
      return { cls: 's-mid', txt: 'precisa validar' };
    }
    // veredito em UMA linha
    function vereditoHTML(row) {
      if (!anyScore(row)) return '<div class="mx-vd"><span class="dot mid"></span><span class="vl">Veredito:</span><span class="vx">pontua os critérios pra ver a leitura.</span></div>';
      var v = verdict(row), d = v.tag === 'ok' ? 'ok' : (v.tag === 'inviavel' ? 'bad' : 'mid');
      return '<div class="mx-vd"><span class="dot ' + d + '"></span><span class="vl">Veredito:</span><span class="vx">' + esc(v.txt) + '</span></div>';
    }
    function verdictHTML(row) {
      var v = verdict(row), em = evMissing(row);
      var extra = em ? ' · falta evidência em ' + em + ' nota' + (em > 1 ? 's' : '') : '';
      return '<div class="adp-verdict v-' + v.tag + '"><span class="vs"><svg viewBox="0 0 24 24"><path d="M12 3l2.5 5.5L20 9.3l-4 3.9.9 5.8L12 16.2 7.1 19l.9-5.8-4-3.9 5.5-.8z"/></svg></span><div class="vt"><b>Veredito rápido</b><br>' + esc(v.txt + extra) + '</div></div>';
    }
    function champHTML() {
      var hp = hipotesePrincipal(rows);
      if (!hp) return 'Nomeia os candidatos, pontua os 7 critérios (1–5) e põe a evidência de cada nota. O nicho sai dos dois eixos, não de achismo.';
      return '<b>Hipótese pros 30 dias: ' + esc(hp.nicho) + '</b><br>'
        + 'Mercado ' + hp.soma_mercado + '/20 · Você ' + hp.soma_voce + '/15<br>'
        + 'Risco: ' + esc(hp.risco) + '<br>'
        + 'Primeiro teste: ' + esc(hp.primeiro_teste);
    }
    function paint() {
      mx.innerHTML = rows.map(function (row, i) {
        var sm = somaEixo(row, 'mercado'), sv = somaEixo(row, 'voce');
        // candidato colapsado (acordeão) — linha resumida clicável
        if (i !== openIdx && rows.length > 1) {
          return '<div class="mx-cbar" data-i="' + i + '">'
            + '<span class="mx-cbtitle">Candidato ' + (i + 1) + (row.name ? ' · ' + esc(row.name) : '') + '</span>'
            + '<span class="mx-cbread">Mercado ' + sm + '/20 · Você ' + sv + '/15</span>'
            + '<svg class="chev" viewBox="0 0 24 24"><path d="m6 9 6 6 6-6"/></svg></div>';
        }
        var stt = stateChip(row);
        return '<div class="mx-cand" data-i="' + i + '">'
          + '<div class="mx-cand-h">'
          +   '<span class="mx-lead">Candidato ' + (i + 1) + '</span>'
          +   '<input class="mx-name" data-i="' + i + '" value="' + esc(row.name) + '" placeholder="dá um nome (ex: clínicas de estética premium)">'
          +   '<span class="mx-state ' + stt.cls + '">' + stt.txt + '</span>'
          +   (rows.length > 1 ? '<button type="button" class="mx-del" data-i="' + i + '">remover</button>' : '')
          + '</div>'
          + EIXOS.map(function (e) { return eixoHTML(row, i, e); }).join('')
          + vereditoHTML(row) + '</div>';
      }).join('');
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

    // digitar o nome não deve re-renderizar (perderia o foco) — só atualiza o campeão
    container.addEventListener('input', function (e) {
      var t = e.target, i = +t.dataset.i;
      if (t.classList.contains('mx-name')) { rows[i].name = t.value; persist(); }
      else if (t.classList.contains('mx-ev')) { rows[i].cells[t.dataset.k].ev = t.value; persist(); }
    });
    // confiança = select secundário
    container.addEventListener('change', function (e) {
      var t = e.target;
      if (t.classList.contains('mx-confsel')) { rows[+t.dataset.i].cells[t.dataset.k].conf = t.value; paint(); persist(); }
    });
    container.addEventListener('click', function (e) {
      var C = e.target.closest ? e.target.closest.bind(e.target) : function () { return null; };
      // nota (1–5): clica o número, o escolhido cresce/fica preto
      var nn = C('.mx-nn');
      if (nn) { var ni = +nn.dataset.i, nk = nn.dataset.k, nv = +nn.dataset.v; rows[ni].cells[nk].nota = (rows[ni].cells[nk].nota === nv ? 0 : nv); paint(); persist(); return; }
      // abrir editor de evidência inline
      var evbtn = C('.mx-evbtn');
      if (evbtn) {
        var ei = +evbtn.dataset.i, ek = evbtn.dataset.k, line = evbtn.parentNode;
        line.innerHTML = '<textarea class="mx-ev" data-i="' + ei + '" data-k="' + ek + '" rows="2" placeholder="Qual fato sustenta essa nota? Sem evidência ela é torcida.">' + esc(rows[ei].cells[ek].ev || '') + '</textarea>';
        var ta = line.querySelector('textarea');
        if (ta) { ta.focus(); ta.addEventListener('blur', function () { rows[ei].cells[ek].ev = ta.value; persist(); line.innerHTML = evLineHTML(ei, ek, rows[ei].cells[ek]); }); }
        return;
      }
      // expandir candidato colapsado
      var bar = C('.mx-cbar');
      if (bar) { openIdx = +bar.dataset.i; paint(); return; }
      // adicionar candidato (abre ele)
      if (e.target.classList.contains('adp-addcand')) { rows.push(normRow()); openIdx = rows.length - 1; paint(); persist(); return; }
      // remover
      var del = C('.mx-del');
      if (del) { rows.splice(+del.dataset.i, 1); if (!rows.length) rows.push(normRow()); if (openIdx >= rows.length) openIdx = rows.length - 1; paint(); persist(); }
    });
    container.addEventListener('focusout', function () { doSave(2, matData(), st, onSaved); });
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
        else res.gate = { sev: 'ok', label: 'matéria-prima com prova' };
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
        else if (!champ) res.gate = { sev: 'importante', label: 'nenhum nicho fecha os 2 eixos' };
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

  return { BLOCKS: BLOCKS, byBlock: byBlock, isFilled: isFilled, renderBlock: renderBlock, nichoFromBlock2: nichoFromBlock2, gateForBlock: gateForBlock, blockCompletion: blockCompletion };
})();
