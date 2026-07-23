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
    var out = { name: r.name || '', cells: {} };
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
    // --- Matriz v2 (grid de cards por critério) ---
    + '.adp-mx{margin-top:8px;display:flex;flex-direction:column;gap:16px}'
    + '.mx-cand{border:1px solid var(--line,#d4d4d8);border-radius:14px;padding:18px 18px 16px;background:#fff}'
    + '.mx-cand-h{display:flex;align-items:center;gap:12px;margin-bottom:16px}'
    + '.mx-name{flex:1;min-width:0;border:none;border-bottom:1.5px solid var(--line,#d4d4d8);background:transparent;font:inherit;font-weight:700;font-size:15.5px;color:var(--ink,#18181b);padding:5px 2px}'
    + '.mx-name:focus{outline:none;border-color:var(--ink,#18181b)}'
    + '.mx-cand-r{display:flex;align-items:center;gap:12px;flex:none}'
    + '.mx-del{display:inline-flex;align-items:center;gap:5px;font-size:12.5px;color:var(--muted,#71717a);cursor:pointer}'
    + '.mx-del:hover{color:var(--pink,#ff00d7)}'
    + '.mx-del svg{width:13px;height:13px;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round;pointer-events:none}'
    + '.mx-total{font-size:12px;font-weight:700;padding:5px 11px;border-radius:999px;background:var(--soft,#e6e6e8);color:var(--ink,#18181b);white-space:nowrap}'
    + '.mx-total.hi{background:var(--lime,#e7f99a)}'
    + '.mx-bars{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:16px}'
    + '@media(max-width:560px){.mx-bars{grid-template-columns:1fr}}'
    + '.mx-bar .mx-bl{display:flex;justify-content:space-between;align-items:baseline;font-size:12.5px;color:var(--muted,#71717a);margin-bottom:6px}'
    + '.mx-bar .mx-bl b{color:var(--ink,#18181b);font-weight:700}'
    + '.mx-track{height:7px;border-radius:999px;background:var(--soft,#e6e6e8);overflow:hidden}'
    + '.mx-track i{display:block;height:100%;background:var(--pink,#ff00d7);border-radius:999px;transition:width .3s}'
    + '.mx-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px}'
    + '@media(max-width:1080px){.mx-grid{grid-template-columns:repeat(3,1fr)}}'
    + '@media(max-width:760px){.mx-grid{grid-template-columns:repeat(2,1fr)}}'
    + '@media(max-width:480px){.mx-grid{grid-template-columns:1fr}}'
    + '.mx-crit{border:1px solid var(--line,#d4d4d8);border-radius:12px;padding:13px;display:flex;flex-direction:column;gap:9px}'
    + '.mx-crit-top{display:flex;align-items:flex-start;gap:8px}'
    + '.mx-crit-top .ic{flex:none;color:var(--muted,#71717a);display:flex;margin-top:1px}'
    + '.mx-crit-top .ic svg{width:16px;height:16px;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}'
    + '.mx-crit-h{font-size:13px;font-weight:700;color:var(--ink,#18181b);line-height:1.25}'
    + '.mx-crit-q{font-size:11.5px;color:var(--faint,#a1a1aa);line-height:1.35;flex:1;min-height:2.4em}'
    + '.mx-crit-ctrl{display:flex;gap:6px}'
    + '.mx-nota,.mx-conf{border:1px solid var(--line,#d4d4d8);border-radius:8px;background:#fff;font:inherit;font-size:12.5px;padding:6px 7px;color:var(--ink,#18181b);cursor:pointer}'
    + '.mx-nota{font-weight:700;flex:none;width:52px}'
    + '.mx-conf{flex:1;min-width:0}'
    + '.mx-nota:focus,.mx-conf:focus{outline:none;border-color:var(--ink,#18181b)}'
    + '.mx-evlbl{font-size:11px;font-weight:700;color:var(--muted,#71717a);margin-bottom:5px}'
    + '.mx-ev{width:100%;border:1px solid var(--line,#d4d4d8);border-radius:8px;background:var(--surface,#f1f1f1);font:inherit;font-size:12px;padding:8px 9px;color:#3f3f46;resize:none;min-height:62px;line-height:1.4}'
    + '.mx-ev:focus{outline:none;border-color:var(--ink,#18181b);background:#fff}'
    + '.mx-dica{border:1px solid rgba(231,249,154,.85);background:rgba(231,249,154,.3);border-radius:12px;padding:14px}'
    + '.mx-dica .dh{display:flex;align-items:center;gap:7px;font-size:12.5px;font-weight:700;color:var(--ink,#18181b);margin-bottom:8px}'
    + '.mx-dica .dh svg{width:15px;height:15px;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}'
    + '.mx-dica p{font-size:12px;color:#3f3f46;line-height:1.5}'
    + '.adp-verdict{margin-top:14px;font-size:12.5px;font-weight:700;padding:11px 14px;border-radius:10px;line-height:1.4}'
    + '.v-todo{background:var(--soft,#e6e6e8);color:var(--muted,#71717a)}'
    + '.v-ok{background:var(--lime,#e7f99a);color:var(--ink,#18181b)}'
    + '.v-alerta,.v-construcao,.v-confortavel{background:rgba(255,0,215,.08);color:var(--ink,#18181b)}'
    + '.v-inviavel{background:var(--ink,#18181b);color:#fff}'
    + '.adp-addcand{margin-top:2px;font-size:13px;font-weight:700;color:var(--ink,#18181b);border:1.5px dashed var(--line,#d4d4d8);border-radius:10px;padding:11px 14px;width:100%;cursor:pointer}'
    + '.adp-addcand:hover{border-color:var(--ink,#18181b)}'
    + '.adp-champ{margin-top:16px;font-size:14px;line-height:1.6;padding:14px 16px;border:1.5px solid var(--pink,#ff00d7);border-radius:12px;background:rgba(255,0,215,.04)}.adp-champ b{font-weight:700}'
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
    container.innerHTML = '<div class="adp-mx"></div>'
      + '<button type="button" class="adp-addcand">+ candidato a nicho</button>'
      + '<div class="adp-champ"></div><div class="adp-savest"></div>';
    var mx = container.querySelector('.adp-mx');
    var champEl = container.querySelector('.adp-champ');
    var st = container.querySelector('.adp-savest');
    var save = makeSaver(2, st, onSaved);

    function notaOpts(sel) { var s = '<option value="">—</option>'; for (var i = 1; i <= 5; i++) s += '<option ' + (i === sel ? 'selected' : '') + '>' + i + '</option>'; return s; }
    function confOpts(sel) {
      return [['', 'confiança?'], ['baixa', 'baixa'], ['media', 'média'], ['alta', 'alta']]
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
    var DICA_HTML = '<div class="mx-dica"><div class="dh"><svg viewBox="0 0 24 24"><path d="M12 3l7.5 3.5V12c0 4.2-3.2 7.2-7.5 8.5C7.7 19.2 4.5 16.2 4.5 12V6.5z"/></svg>Dica do Escavador</div><p>Sem prova ainda? Tudo bem. Marca a nota baixa e vai atrás de 1 caso real pra validar — nota sem evidência é torcida, não nicho.</p></div>';
    function barsHTML(row) {
      var sm = somaEixo(row, 'mercado'), sv = somaEixo(row, 'voce');
      return '<div class="mx-bars">'
        + '<div class="mx-bar"><div class="mx-bl"><span>O mercado vale a pena?</span><b>' + sm + '/20</b></div><div class="mx-track"><i style="width:' + Math.round(sm / 20 * 100) + '%"></i></div></div>'
        + '<div class="mx-bar"><div class="mx-bl"><span>Você tem vantagem aqui?</span><b>' + sv + '/15</b></div><div class="mx-track"><i style="width:' + Math.round(sv / 15 * 100) + '%"></i></div></div>'
        + '</div>';
    }
    function critCardHTML(row, i, k) {
      var c = CRITDEF[k], cell = row.cells[k];
      return '<div class="mx-crit">'
        + '<div class="mx-crit-top"><span class="ic"><svg viewBox="0 0 24 24">' + CRIT_ICON[k] + '</svg></span><span class="mx-crit-h">' + esc(c.h) + '</span></div>'
        + '<div class="mx-crit-q">' + esc(c.hint) + '</div>'
        + '<div class="mx-crit-ctrl"><select class="mx-nota" data-i="' + i + '" data-k="' + k + '">' + notaOpts(cell.nota) + '</select>'
        + '<select class="mx-conf" data-i="' + i + '" data-k="' + k + '">' + confOpts(cell.conf) + '</select></div>'
        + '<div><div class="mx-evlbl">Evidência</div><textarea class="mx-ev" data-i="' + i + '" data-k="' + k + '" rows="2" placeholder="O fato, não a torcida. Sem ele, a nota não vale.">' + esc(cell.ev) + '</textarea></div>'
        + '</div>';
    }
    function verdictHTML(row) {
      var v = verdict(row), em = evMissing(row);
      var extra = em ? ' · falta evidência em ' + em + ' nota' + (em > 1 ? 's' : '') : '';
      return '<div class="adp-verdict v-' + v.tag + '">' + esc(v.txt + extra) + '</div>';
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
        var sm = somaEixo(row, 'mercado'), sv = somaEixo(row, 'voce'), total = sm + sv;
        var crits = CRIT_ORDER.map(function (k) { return critCardHTML(row, i, k); }).join('');
        return '<div class="mx-cand" data-i="' + i + '">'
          + '<div class="mx-cand-h"><input class="mx-name" data-i="' + i + '" value="' + esc(row.name) + '" placeholder="Candidato ' + (i + 1) + ' — vertical + horizontal (ex: clínicas saindo de convênio)">'
          + '<div class="mx-cand-r">' + (rows.length > 1 ? '<button type="button" class="mx-del" data-i="' + i + '"><svg viewBox="0 0 24 24"><path d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M6 7l1 13h10l1-13"/></svg>remover</button>' : '')
          + '<span class="mx-total' + (total >= 24 ? ' hi' : '') + '">Total: ' + total + '/35</span></div></div>'
          + barsHTML(row)
          + '<div class="mx-grid">' + crits + DICA_HTML + '</div>'
          + verdictHTML(row) + '</div>';
      }).join('');
      champEl.innerHTML = champHTML();
    }
    function matData() {
      return {
        rows: rows.map(function (r) {
          return { name: r.name, cells: r.cells, soma_mercado: somaEixo(r, 'mercado'), soma_voce: somaEixo(r, 'voce'), total: somaEixo(r, 'mercado') + somaEixo(r, 'voce'), veredito: verdict(r).txt };
        }),
        hipotese_principal: hipotesePrincipal(rows)
      };
    }
    function persist() { if (st) st.textContent = '…'; save(matData); }

    // digitar o nome não deve re-renderizar (perderia o foco) — só atualiza o campeão
    container.addEventListener('input', function (e) {
      var t = e.target, i = +t.dataset.i;
      if (t.classList.contains('mx-name')) { rows[i].name = t.value; champEl.innerHTML = champHTML(); persist(); }
      else if (t.classList.contains('mx-ev')) { rows[i].cells[t.dataset.k].ev = t.value; persist(); }
    });
    // selects (nota/confiança) disparam no blur — re-render é seguro
    container.addEventListener('change', function (e) {
      var t = e.target, i = +t.dataset.i;
      if (t.classList.contains('mx-nota')) { rows[i].cells[t.dataset.k].nota = +t.value || 0; paint(); persist(); }
      else if (t.classList.contains('mx-conf')) { rows[i].cells[t.dataset.k].conf = t.value; paint(); persist(); }
    });
    container.addEventListener('click', function (e) {
      if (e.target.classList.contains('adp-addcand')) { rows.push(normRow()); paint(); persist(); return; }
      var del = e.target.closest && e.target.closest('.mx-del');
      if (del) { rows.splice(+del.dataset.i, 1); if (!rows.length) rows.push(normRow()); paint(); persist(); }
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
