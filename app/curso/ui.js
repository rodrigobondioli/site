// UI compartilhada: normaliza navegação + drawers laterais (Suporte, Sugestão, Perfil) + toasts.
// Incluir por último (depois de supabase-js, config.js, api.js).
(function () {
  var VIN = "Vinila,-apple-system,'Segoe UI',system-ui,sans-serif";

  // ---------- estilos ----------
  var css = `
  .adp-ov{position:fixed;inset:0;background:rgba(16,16,16,.42);opacity:0;pointer-events:none;transition:opacity .22s;z-index:60}
  .adp-ov.on{opacity:1;pointer-events:auto}
  .adp-dw{position:fixed;top:0;right:0;height:100%;width:440px;max-width:92vw;background:#fff;box-shadow:-14px 0 40px -20px rgba(0,0,0,.4);
    transform:translateX(100%);transition:transform .26s cubic-bezier(.4,0,.2,1);z-index:61;display:flex;flex-direction:column;font-family:${VIN}}
  .adp-dw.on{transform:translateX(0)}
  .adp-dh{display:flex;align-items:center;justify-content:space-between;padding:20px 26px;border-bottom:1px solid #ececee;flex:none}
  .adp-dh h3{font-size:19px;font-weight:700;color:#18181b;letter-spacing:-.01em}
  .adp-x{width:34px;height:34px;border-radius:999px;display:grid;place-items:center;border:0;background:none;cursor:pointer;color:#71717a}
  .adp-x:hover{background:#f1f1f1;color:#18181b}
  .adp-x svg{width:19px;height:19px;fill:none;stroke:currentColor;stroke-width:1.9;stroke-linecap:round}
  .adp-db{padding:24px 26px 30px;overflow-y:auto;flex:1;color:#18181b}
  .adp-db p.sub{font-size:14px;color:#71717a;line-height:1.6;margin:0 0 20px}
  .adp-f label{display:block;font-size:12.5px;font-weight:700;color:#71717a;margin:16px 0 7px}
  .adp-f input,.adp-f textarea,.adp-f select{width:100%;border:1px solid #d4d4d8;border-radius:10px;background:#fff;padding:11px 13px;
    font:inherit;font-size:14.5px;color:#18181b;outline:none}
  .adp-f input:focus,.adp-f textarea:focus,.adp-f select:focus{border-color:#18181b}
  .adp-f textarea{min-height:120px;resize:vertical;line-height:1.55}
  .adp-f input[readonly]{background:#f5f5f6;color:#71717a}
  .adp-f .row2{display:flex;gap:12px}.adp-f .row2>*{flex:1}
  .adp-btn{margin-top:22px;width:100%;border:0;background:#ff00d7;color:#fff;font-weight:700;font-size:15px;padding:13px;border-radius:999px;cursor:pointer;font-family:${VIN}}
  .adp-btn:hover{filter:brightness(1.06)}
  .adp-btn[disabled]{opacity:.6;cursor:not-allowed}
  .adp-msg{font-size:13.5px;margin-top:14px;color:#71717a;min-height:1em}
  .adp-ghost{margin-top:14px;width:100%;border:1px solid #d4d4d8;background:#fff;color:#18181b;font-weight:700;font-size:14px;padding:11px;border-radius:999px;cursor:pointer;font-family:${VIN}}
  .adp-ghost:hover{background:#f1f1f1}
  /* perfil foto */
  .adp-photo{display:flex;align-items:center;gap:16px;margin-bottom:8px}
  .adp-photo .pic{width:66px;height:66px;border-radius:999px;overflow:hidden;box-shadow:0 0 0 1px #ececee;flex:none;background:#f1f1f1}
  .adp-photo .pic img{width:100%;height:100%;object-fit:cover}
  .adp-photo .acts{display:flex;gap:8px}
  .adp-photo .acts button{border:1px solid #d4d4d8;background:#fff;font-weight:700;font-size:13px;padding:7px 14px;border-radius:999px;cursor:pointer;font-family:${VIN}}
  .adp-photo .acts button:hover{background:#f1f1f1}
  .adp-signout{margin-top:26px;padding-top:18px;border-top:1px solid #ececee}
  .adp-signout a{font-size:13.5px;color:#71717a;text-decoration:none;font-weight:700}
  .adp-signout a:hover{color:#ff00d7}
  /* toast */
  .adp-toast{position:fixed;left:50%;bottom:26px;transform:translateX(-50%) translateY(20px);background:#18181b;color:#fff;
    font-family:${VIN};font-size:14px;font-weight:600;padding:12px 20px;border-radius:999px;opacity:0;pointer-events:none;transition:.25s;z-index:70}
  .adp-toast.on{opacity:1;transform:translateX(-50%) translateY(0)}
  .adp-chips{display:flex;flex-wrap:wrap;gap:8px;margin-top:2px}
  .adp-chip{border:1px solid #d4d4d8;border-radius:999px;padding:8px 14px;font-size:13px;font-weight:700;cursor:pointer;background:#fff;color:#18181b}
  .adp-chip.on{background:#18181b;color:#fff;border-color:#18181b}
  @media(max-width:520px){.adp-dw{width:100%}}
  `;
  var st = document.createElement("style"); st.textContent = css; document.head.appendChild(st);

  // ---------- toast ----------
  var toastEl;
  function toast(t) {
    if (!toastEl) { toastEl = document.createElement("div"); toastEl.className = "adp-toast"; document.body.appendChild(toastEl); }
    toastEl.textContent = t; toastEl.classList.add("on");
    clearTimeout(toastEl._t); toastEl._t = setTimeout(function(){ toastEl.classList.remove("on"); }, 2600);
  }

  // ---------- drawer shell ----------
  var ov = document.createElement("div"); ov.className = "adp-ov";
  var dw = document.createElement("div"); dw.className = "adp-dw"; dw.setAttribute("role","dialog");
  dw.innerHTML = '<div class="adp-dh"><h3></h3><button class="adp-x" aria-label="Fechar"><svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg></button></div><div class="adp-db"></div>';
  document.body.appendChild(ov); document.body.appendChild(dw);
  var dTitle = dw.querySelector("h3"), dBody = dw.querySelector(".adp-db");
  function open(title, html) { dTitle.textContent = title; dBody.innerHTML = html; ov.classList.add("on"); dw.classList.add("on"); }
  function close() { ov.classList.remove("on"); dw.classList.remove("on"); }
  ov.addEventListener("click", close);
  dw.querySelector(".adp-x").addEventListener("click", close);
  document.addEventListener("keydown", function(e){ if (e.key === "Escape") close(); });

  // ---------- supabase helpers ----------
  var c = window.ADP_CONFIG || {};
  function sb(){ return window.__sb || (window.supabase && c.SUPABASE_URL && !String(c.SUPABASE_URL).includes("SEU-PROJETO") ? window.supabase.createClient(c.SUPABASE_URL, c.SUPABASE_ANON_KEY) : null); }
  async function currentUser(){ var s=sb(); if(!s) return null; try{ var r=await s.auth.getUser(); return r.data && r.data.user; }catch(e){ return null; } }

  // ---------- SUPORTE ----------
  function openSuporte() {
    open("Suporte", `
      <p class="sub">Travou em algo? Conta aqui que a gente resolve. Respondo no seu e-mail.</p>
      <form class="adp-f" id="adpSup">
        <label>Assunto</label>
        <input name="assunto" placeholder="Ex: não consigo abrir a aula 2">
        <label>Mensagem</label>
        <textarea name="mensagem" placeholder="Descreve o que aconteceu…" required></textarea>
        <button class="adp-btn" type="submit">Enviar</button>
        <p class="adp-msg" id="adpSupMsg"></p>
      </form>`);
    wireForm("adpSup","adpSupMsg","suporte");
  }

  // ---------- SUGESTÃO ----------
  var SUG_TIPOS = ["Nova aula ou conteúdo","Ferramenta ou IA","Achei um bug","Outro"];
  function openSugestao() {
    open("Sugestão", `
      <p class="sub">Esse produto se constrói com você. Tem ideia de aula, ferramenta, ou achou algo quebrado? Manda — leio tudo.</p>
      <form class="adp-f" id="adpSug">
        <label>Tipo</label>
        <div class="adp-chips" id="adpChips">${SUG_TIPOS.map((t,i)=>`<span class="adp-chip${i===0?' on':''}" data-v="${t}">${t}</span>`).join("")}</div>
        <input type="hidden" name="tipo" value="${SUG_TIPOS[0]}">
        <label>Sua sugestão</label>
        <textarea name="mensagem" placeholder="Escreve sua ideia…" required></textarea>
        <button class="adp-btn" type="submit">Enviar sugestão</button>
        <p class="adp-msg" id="adpSugMsg"></p>
      </form>`);
    var chips = dBody.querySelectorAll(".adp-chip"), hidden = dBody.querySelector('input[name=tipo]');
    chips.forEach(function(ch){ ch.addEventListener("click", function(){ chips.forEach(x=>x.classList.remove("on")); ch.classList.add("on"); hidden.value = ch.dataset.v; }); });
    wireForm("adpSug","adpSugMsg","sugestao");
  }

  function wireForm(formId, msgId, kind) {
    var f = document.getElementById(formId), msg = document.getElementById(msgId);
    f.addEventListener("submit", async function(e){
      e.preventDefault();
      var btn = f.querySelector(".adp-btn"); btn.disabled = true; msg.textContent = "Enviando…";
      var data = { kind: kind }; new FormData(f).forEach((v,k)=>data[k]=v);
      var u = await currentUser(); if (u) data.email = u.email;
      try {
        var t = u ? (await sb().auth.getSession()).data.session?.access_token : null;
        var r = await fetch("/api/feedback", { method:"POST", headers: Object.assign({"Content-Type":"application/json"}, t?{Authorization:"Bearer "+t}:{}), body: JSON.stringify(data) });
        var j = await r.json().catch(()=>({}));
        if (!r.ok) throw new Error(j.error || "erro");
        msg.textContent = "Recebido. Valeu! 👊"; f.reset();
        setTimeout(close, 1200);
      } catch(err){ msg.textContent = "Deu ruim: " + err.message; }
      btn.disabled = false;
    });
  }

  // ---------- PERFIL ----------
  async function openPerfil() {
    var u = await currentUser();
    var meta = (u && u.user_metadata) || {};
    var nome = meta.full_name || meta.name || "";
    var email = (u && u.email) || "";
    var pic = meta.avatar_url || "/app/eu-login.webp";
    open("Editar perfil", `
      <div class="adp-photo">
        <span class="pic"><img src="${pic}" alt=""></span>
        <div class="acts"><button type="button" id="adpFoto">Alterar</button><button type="button" id="adpFotoRm">Remover</button></div>
      </div>
      <form class="adp-f" id="adpPerf">
        <label>Nome completo</label>
        <input name="full_name" value="${(nome||"").replace(/"/g,'&quot;')}" placeholder="Seu nome">
        <label>Headline</label>
        <input name="headline" value="${(meta.headline||"").replace(/"/g,'&quot;')}" placeholder="Ex: Designer de barbearias premium">
        <label>Bio</label>
        <textarea name="bio" placeholder="Conta um pouco sobre você…">${meta.bio||""}</textarea>
        <label>E-mail</label>
        <input value="${email}" readonly>
        <button class="adp-btn" type="submit">Salvar alterações</button>
        <p class="adp-msg" id="adpPerfMsg"></p>
      </form>
      <div class="adp-signout"><a href="#" id="adpSair">Sair da conta</a></div>`);

    dBody.querySelector("#adpFoto").addEventListener("click", ()=>toast("Upload de foto: em breve"));
    dBody.querySelector("#adpFotoRm").addEventListener("click", ()=>toast("Foto removida (visual)"));
    dBody.querySelector("#adpSair").addEventListener("click", async function(e){ e.preventDefault(); var s=sb(); if(s){ await s.auth.signOut(); } location.href = "/"; });

    var f = dBody.querySelector("#adpPerf"), msg = dBody.querySelector("#adpPerfMsg");
    f.addEventListener("submit", async function(e){
      e.preventDefault();
      var s = sb(); if(!s){ msg.textContent = "Modo dev — publique com Supabase pra salvar."; return; }
      var btn = f.querySelector(".adp-btn"); btn.disabled = true; msg.textContent = "Salvando…";
      var data = {}; new FormData(f).forEach((v,k)=>data[k]=v);
      try { var r = await s.auth.updateUser({ data: data }); if (r.error) throw r.error; msg.textContent = "Salvo ✓"; }
      catch(err){ msg.textContent = "Erro: " + err.message; }
      btn.disabled = false;
    });
  }

  // ---------- normaliza navegação ----------
  var MAP = {
    "início do curso":"home.html","inicio do curso":"home.html","aulas":"aula.html",
    "meu canvas":"canvas.html","meu posicionamento":"posicionamento.html",
    "início":"home.html","inicio":"home.html","cursos":"cursos.html"
  };
  function txt(el){ return (el.textContent||"").trim().toLowerCase(); }

  // topbar tabs + sidebar nav
  document.querySelectorAll(".tabs a, .side nav a").forEach(function(a){
    var t = txt(a);
    if (t === "suporte") { a.href = "#"; a.addEventListener("click", function(e){ e.preventDefault(); openSuporte(); }); return; }
    if (t === "sugestão" || t === "sugestao") { a.href = "#"; a.addEventListener("click", function(e){ e.preventDefault(); openSugestao(); }); return; }
    if (t === "comunidade") { a.href = "#"; a.addEventListener("click", function(e){ e.preventDefault(); toast("Comunidade: em breve"); }); return; }
    if (MAP[t] && (a.getAttribute("href") === "#" || !a.getAttribute("href"))) { a.href = MAP[t]; }
  });
  // logo -> home
  document.querySelectorAll("a.logo").forEach(function(a){ if(a.getAttribute("href")==="#"||!a.getAttribute("href")) a.href="home.html"; });
  // busca -> toast
  document.querySelectorAll(".search").forEach(function(el){ el.style.cursor="pointer"; el.addEventListener("click", ()=>toast("Busca: em breve")); });
  // avatar -> perfil
  document.querySelectorAll(".avatar").forEach(function(el){ el.style.cursor="pointer"; el.addEventListener("click", openPerfil); });

  // neutraliza qualquer '#' restante (evita pulo pro topo em links de demo)
  document.querySelectorAll('a[href="#"]').forEach(function(a){ a.addEventListener("click", function(e){ e.preventDefault(); }); });

  // expõe (caso queira chamar de outro lugar)
  window.ADP_UI = { suporte: openSuporte, sugestao: openSugestao, perfil: openPerfil, toast: toast };
})();
