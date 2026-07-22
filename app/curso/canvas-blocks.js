// Fonte única dos blocos do Canvas. Usado inline na aula E na tela Meu Canvas.
// Cada bloco = matéria-prima que o Estrategista lê no final.
// Salva via window.ADP.saveBlock(block, data) e carrega via window.ADP.loadCanvas().
window.ADP_CANVAS = (function () {
  var CRIT = [
    { k: 'r', h: 'Repert.' }, { k: 'n', h: 'Necess.' }, { k: 'c', h: 'Cresc.' },
    { k: 'p', h: 'Poder' }, { k: 'a', h: 'Acesso' }
  ];

  var BLOCKS = [
    { block: 0, title: 'Sobre você', type: 'fields', fields: [
      { key: 'mundos',   label: 'Mundos que você já conhece por dentro', ph: 'Trampo antigo, negócio da família, hobby, paixão — mercados que você já vive.' },
      { key: 'forte',    label: 'O que sai fácil e onde você já tem prova', ph: 'O projeto que sai quase no automático — e pra que tipo de cliente você já tem trabalho pra mostrar.' },
      { key: 'turmas',   label: 'Suas turmas e comunidades',              ph: 'Academia, futebol, RPG, igreja, trampo antigo, pais de pet… onde esse tipo de dono se encontra.' },
      { key: 'historia', label: 'Sua história',                           ph: 'De onde você veio e por que faz o que faz do jeito que faz. O que só você tem.' }
    ]},
    { block: 1, title: 'O inimigo (seus medos)', type: 'fields', fields: [
      { key: 'segura',       label: 'O que te segura no genérico',        ph: 'Qual medo te impede de nichar? Escreve cru — medo escrito perde metade da força.' },
      { key: 'visibilidade', label: 'Como teu cliente ideal te acharia hoje?', ph: 'Quantos cliques até chegar em você? Escreve honesto.' }
    ]},
    { block: 2, title: 'A Matriz do Nicho', type: 'matrix' },
    { block: 3, title: 'Quem você atende (a dor)', type: 'fields', fields: [
      { key: 'nao',           label: 'Quem eu NÃO atendo (obrigatório)',  ph: 'Quem você recusa. Começa por aqui — posicionamento é dizer não.' },
      { key: 'ideal',         label: 'Cliente ideal — situação e dor',    ph: 'Não idade e CEP. A situação que ele vive e a dor que o mantém acordado.' },
      { key: 'intermediario', label: 'Cliente intermediário',             ph: 'Serve, mas não é o sonho.' },
      { key: 'dor',           label: 'A dor-loop principal',              ph: 'A vozinha que não cala na cabeça dele. Roda a Caça à Ruminação se travar.' }
    ]},
    { block: 4, title: 'Seu monopólio', type: 'fields', fields: [
      { key: 'diferencial', label: 'Seu diferencial que ninguém copia', ph: 'Tua história, o que só você tem — o cruzamento do nicho com quem você é.' },
      { key: 'frase',       label: 'Rascunho da tua frase',             ph: 'Eu resolvo [a dor] para [o nicho] através de [o teu recorte]. Nem que fique tosco.' }
    ]}
  ];

  function byBlock(n) { for (var i = 0; i < BLOCKS.length; i++) if (BLOCKS[i].block === n) return BLOCKS[i]; return null; }
  function esc(s) { return String(s == null ? '' : s).replace(/[<>&"]/g, function (c) { return { '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' }[c]; }); }
  // um bloco "preenchido" = tem pelo menos um valor não-vazio
  function isFilled(block, data) {
    if (!data) return false;
    if (block === 2) return !!(data.rows && data.rows.some(function (r) { return (r.name || '').trim(); }));
    return Object.keys(data).some(function (k) { var v = data[k]; return v && String(v).trim(); });
  }

  var STYLE = ''
    + '.adp-fld{margin-top:14px}'
    + '.adp-fld label{display:block;font-size:12.5px;font-weight:700;color:var(--muted,#71717a);margin-bottom:7px}'
    + '.adp-fld textarea{width:100%;border:none;border-radius:10px;background:#fff;padding:13px 15px;font:inherit;font-size:14.5px;color:var(--ink,#18181b);resize:none;min-height:66px;line-height:1.55}'
    + '.adp-fld textarea:focus{outline:none}'
    + '.adp-savest{font-size:12px;color:var(--faint,#a1a1aa);margin-top:9px;min-height:1em}'
    + '.adp-savest.err{color:var(--pink,#ff00d7);font-weight:700}'
    + '.adp-mscroll{overflow-x:auto;-webkit-overflow-scrolling:touch}'
    + '@media(max-width:560px){.adp-mtab{min-width:480px}}'
    + '.adp-mtab{width:100%;border-collapse:collapse;font-size:13.5px;margin-top:8px}'
    + '.adp-mtab th{text-align:center;font-weight:700;color:var(--muted,#71717a);font-size:12px;padding:0 0 10px}'
    + '.adp-mtab th:first-child{text-align:left}'
    + '.adp-mtab td{padding:9px 4px;border-top:1px solid var(--line,#d4d4d8);text-align:center;color:#3f3f46}'
    + '.adp-mtab td:first-child{text-align:left}'
    + '.adp-mtab td.tot{font-weight:700;color:var(--ink,#18181b)}'
    + '.adp-mtab tr.win td{background:var(--lime,#e7f99a)}'
    + '.adp-mtab tr.win td:first-child{border-radius:8px 0 0 8px}'
    + '.adp-mtab tr.win td:last-child{border-radius:0 8px 8px 0}'
    + '.adp-mtab input.cand{width:100%;border:1px solid transparent;border-radius:7px;background:transparent;font:inherit;font-weight:700;font-size:13.5px;color:var(--ink,#18181b);padding:6px 8px}'
    + '.adp-mtab input.cand:hover{border-color:var(--line,#d4d4d8)}'
    + '.adp-mtab input.cand:focus{outline:none;border-color:var(--ink,#18181b);background:#fff}'
    + '.adp-mtab select.sc{border:1px solid var(--line,#d4d4d8);border-radius:7px;background:#fff;font:inherit;font-size:13px;padding:5px 6px;color:var(--ink,#18181b);cursor:pointer}'
    + '.adp-mtab select.sc:focus{outline:none;border-color:var(--ink,#18181b)}'
    + '.adp-champ{margin-top:14px;font-size:14px}.adp-champ b{font-weight:700}'
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
    + '.adp-rum .rmsg{font-size:13px;color:var(--muted,#71717a);margin-top:10px;line-height:1.5}';

  function ensureStyle() {
    if (document.getElementById('adp-canvas-style')) return;
    var s = document.createElement('style'); s.id = 'adp-canvas-style'; s.textContent = STYLE;
    document.head.appendChild(s);
  }

  function debounce(fn, ms) { var t; return function () { var a = arguments, c = this; clearTimeout(t); t = setTimeout(function () { fn.apply(c, a); }, ms); }; }

  // salva com feedback visual
  function makeSaver(block, statusEl, onSaved) {
    return debounce(function (getData) {
      var data = getData();
      if (window.ADP && window.ADP.devMode) { if (statusEl) statusEl.textContent = 'salvo (dev)'; if (onSaved) onSaved(block, data); return; }
      window.ADP.saveBlock(block, data).then(function () { if (statusEl) { statusEl.textContent = 'salvo ✓'; statusEl.classList.remove('err'); } if (onSaved) onSaved(block, data); })
        .catch(function () { if (statusEl) { statusEl.textContent = 'não salvou — edite qualquer campo pra tentar de novo'; statusEl.classList.add('err'); } });
    }, 700);
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
    tas.forEach(function (t) { t.addEventListener('input', function () { if (st) st.textContent = '…'; save(gather); }); });
  }

  function renderMatrix(container, data, onSaved) {
    var rows = (data && data.rows && data.rows.length)
      ? data.rows.map(function (r) { return { name: r.name || '', r: +r.r || 0, n: +r.n || 0, c: +r.c || 0, p: +r.p || 0, a: +r.a || 0 }; })
      : [{ name: '', r: 0, n: 0, c: 0, p: 0, a: 0 }, { name: '', r: 0, n: 0, c: 0, p: 0, a: 0 }, { name: '', r: 0, n: 0, c: 0, p: 0, a: 0 }];
    container.innerHTML = '<div class="adp-mscroll"><table class="adp-mtab"><thead><tr><th>Candidato a nicho</th>'
      + CRIT.map(function (c) { return '<th>' + c.h + '</th>'; }).join('') + '<th>Total</th></tr></thead>'
      + '<tbody></tbody></table></div><p class="adp-champ"></p><div class="adp-savest"></div>';
    var body = container.querySelector('tbody');
    var champEl = container.querySelector('.adp-champ');
    var st = container.querySelector('.adp-savest');
    var save = makeSaver(2, st, onSaved);
    function total(row) { return CRIT.reduce(function (a, c) { return a + (+row[c.k] || 0); }, 0); }
    function opts(sel) { var s = ''; for (var i = 0; i <= 5; i++) s += '<option ' + (i === sel ? 'selected' : '') + '>' + i + '</option>'; return s; }
    function paint() {
      body.innerHTML = rows.map(function (row, idx) {
        return '<tr data-i="' + idx + '"><td><input class="cand" data-i="' + idx + '" value="' + esc(row.name) + '" placeholder="Candidato ' + (idx + 1) + '…"></td>'
          + CRIT.map(function (c) { return '<td><select class="sc" data-i="' + idx + '" data-k="' + c.k + '">' + opts(+row[c.k] || 0) + '</select></td>'; }).join('')
          + '<td class="tot">' + total(row) + '</td></tr>';
      }).join('');
      var filled = rows.filter(function (r) { return r.name.trim(); });
      if (!filled.length) { champEl.innerHTML = 'Preenche os candidatos e pontua de 1 a 5 — o de maior soma ganha, sem achismo.'; }
      else {
        var win = filled.slice().sort(function (a, b) { return total(b) - total(a); })[0];
        champEl.innerHTML = 'Seu nicho, pelos números: <b>' + esc(win.name) + '</b> — ' + total(win) + ' pontos.';
        Array.prototype.forEach.call(body.querySelectorAll('tr'), function (tr) { var r = rows[+tr.dataset.i]; tr.classList.toggle('win', r.name.trim() && r === win); });
      }
    }
    function persist() { save(function () { return { rows: rows.map(function (r) { return { name: r.name, r: +r.r, n: +r.n, c: +r.c, p: +r.p, a: +r.a, total: total(r) }; }) }; }); }
    body.addEventListener('input', function (e) { if (e.target.classList.contains('cand')) { rows[+e.target.dataset.i].name = e.target.value; if (st) st.textContent = '…'; paint(); persist(); } });
    body.addEventListener('change', function (e) { if (e.target.classList.contains('sc')) { rows[+e.target.dataset.i][e.target.dataset.k] = +e.target.value; if (st) st.textContent = '…'; paint(); persist(); } });
    paint();
  }

  // nicho campeão a partir dos dados do Bloco 2 (Matriz)
  function nichoFromBlock2(data2) {
    if (!data2 || !data2.rows) return '';
    var f = data2.rows.filter(function (r) { return (r.name || '').trim(); });
    if (!f.length) return '';
    f = f.slice().sort(function (a, b) { return (b.total || 0) - (a.total || 0); });
    return f[0].name;
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
      if (!nicho) { out.style.display = 'block'; out.innerHTML = '<p class="rmsg">Escolhe teu nicho na Matriz (Bloco 2) primeiro — a Caça precisa saber de qual dono estamos falando.</p>'; return; }
      btn.disabled = true; out.style.display = 'block'; out.innerHTML = '<p class="rmsg">Caçando as ruminações do dono…</p>';
      try {
        var r = await window.ADP.ruminacao(nicho, cliente);
        renderRumResult(out, (r && r.data) ? r.data : r, container);
      } catch (e) { out.innerHTML = '<p class="rmsg">Deu ruim: ' + esc(e.message) + '</p>'; }
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

  return { BLOCKS: BLOCKS, byBlock: byBlock, isFilled: isFilled, renderBlock: renderBlock, nichoFromBlock2: nichoFromBlock2 };
})();
