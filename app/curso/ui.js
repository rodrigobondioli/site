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
  .adp-db p.sub{font-size:14px;color:#71717a;line-height:1.6;margin:0 0 20px;text-wrap:balance}
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
  .adp-photo .pic{width:66px;height:66px;border-radius:999px;overflow:hidden;box-shadow:0 0 0 1px #ececee;flex:none;background:#e6e6e8;cursor:pointer;position:relative}
  .adp-photo .pic img{width:100%;height:100%;object-fit:cover;display:block}
  .adp-photo .pic:hover::after{content:"trocar";position:absolute;inset:0;background:rgba(16,16,16,.55);color:#fff;font-size:10.5px;font-weight:700;letter-spacing:.03em;display:grid;place-items:center;text-transform:uppercase}
  .adp-photo .hint{font-size:12.5px;color:#71717a}
  .adp-signout{margin-top:26px;padding-top:18px;border-top:1px solid #ececee}
  .adp-signout a{font-size:13.5px;color:#71717a;text-decoration:none;font-weight:700}
  .adp-signout a:hover{color:#ff00d7}
  /* toast */
  .adp-toast{position:fixed;left:50%;bottom:26px;transform:translateX(-50%) translateY(20px);background:#18181b;color:#fff;
    font-family:${VIN};font-size:14px;font-weight:600;padding:12px 20px;border-radius:999px;opacity:0;pointer-events:none;transition:.25s;z-index:70}
  .adp-toast.on{opacity:1;transform:translateX(-50%) translateY(0)}
  .adp-toast.ok{background:#e7f99a;color:#101010}
  .adp-toast.erro{background:#ff00d7;color:#fff}
  .adp-chips{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:2px}
  .adp-chip{border:0;border-radius:999px;padding:9px 14px;font-size:13px;font-weight:700;cursor:pointer;background:#f1f1f1;color:#18181b;text-align:center;transition:background .12s,color .12s}
  .adp-chip.on{background:#18181b;color:#fff}
  @media(max-width:520px){.adp-dw{width:100%}}
  /* ---- tema escuro dos drawers (Suporte/Sugestão/Perfil) — igual ao painel de aulas ---- */
  .adp-dw{background:#101010}
  .adp-dh{border-bottom-color:rgba(255,255,255,.1)}
  .adp-dh h3{color:#fff}
  .adp-x{color:rgba(255,255,255,.55)}
  .adp-x:hover{background:rgba(255,255,255,.1);color:#fff}
  .adp-db{color:#fff}
  .adp-db p.sub{color:rgba(255,255,255,.6)}
  .adp-f label{color:rgba(255,255,255,.6)}
  .adp-f input,.adp-f textarea,.adp-f select{background:rgba(255,255,255,.06);border:0;color:#fff}
  .adp-f input::placeholder,.adp-f textarea::placeholder{color:rgba(255,255,255,.38)}
  .adp-f input:focus,.adp-f textarea:focus,.adp-f select:focus{background:rgba(255,255,255,.11)}
  .adp-f input[readonly]{background:rgba(255,255,255,.04);color:rgba(255,255,255,.5)}
  .adp-ghost{background:rgba(255,255,255,.06);border:0;color:#fff}
  .adp-ghost:hover{background:rgba(255,255,255,.11)}
  .adp-msg{color:rgba(255,255,255,.6)}
  .adp-signout{border-top-color:rgba(255,255,255,.1)}
  .adp-signout a{color:rgba(255,255,255,.6)}
  .adp-signout a:hover{color:var(--pink,#ff00d7)}
  .adp-chip{background:rgba(255,255,255,.08);color:#fff}
  .adp-chip:hover{background:rgba(255,255,255,.15)}
  .adp-chip.on{background:#fff;color:#101010}
  .adp-photo .pic{box-shadow:0 0 0 1px rgba(255,255,255,.14);background:rgba(255,255,255,.06)}
  .adp-photo .hint{color:rgba(255,255,255,.55)}
  `;
  var st = document.createElement("style"); st.textContent = css; document.head.appendChild(st);

  // ---------- toast ----------
  var toastEl;
  function toast(t, kind) {
    if (!toastEl) { toastEl = document.createElement("div"); toastEl.className = "adp-toast"; toastEl.setAttribute("role","status"); toastEl.setAttribute("aria-live","polite"); document.body.appendChild(toastEl); }
    toastEl.textContent = t;
    toastEl.classList.remove("ok","erro");
    if (kind === "ok" || kind === "erro") toastEl.classList.add(kind);
    toastEl.classList.add("on");
    clearTimeout(toastEl._t); toastEl._t = setTimeout(function(){ toastEl.classList.remove("on"); }, kind === "erro" ? 4200 : 2600);
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

  // avatar unificado: foto do usuário OU placeholder neutro (barra + drawer sempre iguais)
  var NEUTRAL_AV = '<svg viewBox="0 0 24 24" width="100%" height="100%" style="background:#e6e6e8;display:block" fill="none" stroke="#a1a1aa" stroke-width="1.7"><circle cx="12" cy="9" r="3.4"/><path d="M5.5 20a6.5 6.5 0 0 1 13 0"/></svg>';
  function avatarHTML(url){ return url ? '<img src="'+url+'" alt="" style="width:100%;height:100%;object-fit:cover;display:block">' : NEUTRAL_AV; }
  function setAvatars(url){ document.querySelectorAll(".avatar").forEach(function(el){ el.innerHTML = avatarHTML(url); }); }

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
        toast("Enviado ✓", "ok");
        setTimeout(close, 1000);
      } catch(err){ msg.textContent = "Não consegui enviar agora. Tenta de novo."; }
      btn.disabled = false;
    });
  }

  // ---------- PERFIL ----------
  async function openPerfil() {
    var u = await currentUser();
    var meta = (u && u.user_metadata) || {};
    var nome = meta.full_name || meta.name || "";
    var email = (u && u.email) || "";
    open("Editar perfil", `
      <div class="adp-photo">
        <span class="pic" id="adpPic">${avatarHTML(meta.avatar_url)}</span>
        <span class="hint">Clica na foto pra trocar</span>
        <input type="file" id="adpPicFile" accept="image/*" style="display:none">
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

    // clicar na foto -> escolhe arquivo -> reduz p/ 220px -> salva no perfil (e sincroniza a barra)
    var picEl = dBody.querySelector("#adpPic"), fileEl = dBody.querySelector("#adpPicFile");
    picEl.addEventListener("click", function(){ fileEl.click(); });
    fileEl.addEventListener("change", function(){
      var file = fileEl.files && fileEl.files[0]; if(!file) return;
      var reader = new FileReader();
      reader.onload = function(ev){
        var img = new Image();
        img.onload = async function(){
          var size = 220, cv = document.createElement("canvas"); cv.width = size; cv.height = size;
          var ctx = cv.getContext("2d");
          var s = Math.min(img.width, img.height), sx = (img.width - s)/2, sy = (img.height - s)/2;
          ctx.drawImage(img, sx, sy, s, s, 0, 0, size, size);
          var dataUrl = cv.toDataURL("image/jpeg", 0.82);
          picEl.innerHTML = avatarHTML(dataUrl);
          var sbi = sb(); if(!sbi){ toast("Modo dev — publique pra salvar a foto."); return; }
          try {
            var u = await currentUser(); if(!u) throw new Error("sem sessão");
            var blob = await new Promise(function(res){ cv.toBlob(res, "image/jpeg", 0.82); });
            var path = u.id + ".jpg";
            var up = await sbi.storage.from("avatars").upload(path, blob, { upsert:true, contentType:"image/jpeg" });
            if(up.error) throw up.error;
            var pub = sbi.storage.from("avatars").getPublicUrl(path);
            var url = ((pub.data && pub.data.publicUrl) || "") + "?t=" + Date.now();
            var r = await sbi.auth.updateUser({ data:{ avatar_url: url } }); if(r.error) throw r.error;
            setAvatars(url); toast("Foto atualizada ✓","ok");
          }
          catch(err){ toast("Não consegui salvar a foto. Tenta de novo.","erro"); }
        };
        img.src = ev.target.result;
      };
      reader.readAsDataURL(file);
    });
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
    "início do curso":"home.html","inicio do curso":"home.html","visão geral":"home.html","visao geral":"home.html","aulas":"aula.html",
    "meu canvas":"canvas.html","meu posicionamento":"posicionamento.html",
    "início":"home.html","inicio":"home.html","cursos":"/cursos",
    "bônus":"/curso/bonus.html","bonus":"/curso/bonus.html"
  };
  function txt(el){ return (el.textContent||"").trim().toLowerCase(); }

  // topbar tabs + sidebar nav
  document.querySelectorAll(".tabs a, .side nav a").forEach(function(a){
    var t = txt(a);
    if (t === "suporte") { a.href = "#"; a.addEventListener("click", function(e){ e.preventDefault(); openSuporte(); }); return; }
    if (t === "sugestão" || t === "sugestao") { a.href = "#"; a.addEventListener("click", function(e){ e.preventDefault(); openSugestao(); }); return; }
    if (t === "comunidade") { a.href = "#"; a.classList.add("adp-soonlink"); a.insertAdjacentHTML("beforeend", '<span class="adp-soon">em breve</span>'); a.addEventListener("click", function(e){ e.preventDefault(); toast("Comunidade: em breve"); }); return; }
    if (MAP[t] && (a.getAttribute("href") === "#" || !a.getAttribute("href"))) { a.href = MAP[t]; }
  });
  // logo -> home
  document.querySelectorAll("a.logo").forEach(function(a){ if(a.getAttribute("href")==="#"||!a.getAttribute("href")) a.href="home.html"; });

  // injeta "Bônus" na BARRA LATERAL, depois de "Meu posicionamento" (separador + ícone de presente)
  var GIFT = '<svg viewBox="0 0 24 24"><polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/><line x1="12" y1="22" x2="12" y2="7"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/></svg>';
  document.querySelectorAll(".side > nav").forEach(function(nav){
    if (nav.classList.contains("nav-bottom")) return;      // só o nav principal (topo)
    if (nav.querySelector('a[href*="bonus"]')) return;      // já injetado
    var pos = Array.prototype.filter.call(nav.querySelectorAll("a"), function(a){ return txt(a).indexOf("posicionamento") >= 0; })[0];
    var sep = document.createElement("div"); sep.className = "sep"; sep.style.cssText = "margin:8px 0;border-top:1px solid var(--line)";
    var link = document.createElement("a");
    link.href = "/curso/bonus.html";
    link.innerHTML = GIFT + "Bônus";
    if (/bonus/.test(location.pathname)) link.className = "on";
    if (pos && pos.nextSibling) { nav.insertBefore(sep, pos.nextSibling); nav.insertBefore(link, sep.nextSibling); }
    else { nav.appendChild(sep); nav.appendChild(link); }
  });
  // busca ainda não existe -> esconde (evita afordância morta que parece funcional)
  document.querySelectorAll(".search").forEach(function(el){ el.style.display="none"; });
  // selo "em breve" da Comunidade + leve opacidade no link
  (function(){ var s=document.createElement("style"); s.textContent='.adp-soonlink{opacity:.75}.adp-soon{font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:var(--muted,#71717a);border:1px solid var(--line,#d4d4d8);border-radius:999px;padding:1px 6px;margin-left:6px;vertical-align:1px}'; document.head.appendChild(s); })();
  // avatar -> perfil
  document.querySelectorAll(".avatar").forEach(function(el){ el.style.cursor="pointer"; el.addEventListener("click", openPerfil); });
  // sincroniza a foto da barra com o perfil (ou placeholder neutro)
  currentUser().then(function(u){ setAvatars(u && u.user_metadata && u.user_metadata.avatar_url); });

  // neutraliza qualquer '#' restante (evita pulo pro topo em links de demo)
  document.querySelectorAll('a[href="#"]').forEach(function(a){ a.addEventListener("click", function(e){ e.preventDefault(); }); });

  // ---------- navegação MOBILE (hambúrguer + drawer) ----------
  // no mobile a sidebar (.side) some; sem isso o aluno não chega em Canvas/Posicionamento/Aulas.
  (function mobileNav(){
    var side = document.querySelector(".side"), top = document.querySelector(".top");
    if (!side || !top) return; // aula.html tem layout próprio (back + painel)
    var burger = document.createElement("button");
    burger.className = "adp-burger"; burger.setAttribute("aria-label", "Abrir menu"); burger.setAttribute("aria-expanded", "false");
    burger.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M3 6h18M3 12h18M3 18h18"/></svg>';
    top.insertBefore(burger, top.firstChild);
    var ov = document.createElement("div"); ov.className = "adp-navov"; document.body.appendChild(ov);
    side.classList.add("adp-drawer");
    function set(open){ document.body.classList.toggle("adp-navopen", open); burger.setAttribute("aria-expanded", open ? "true" : "false"); }
    burger.addEventListener("click", function(){ set(!document.body.classList.contains("adp-navopen")); });
    ov.addEventListener("click", function(){ set(false); });
    side.querySelectorAll("a").forEach(function(a){ a.addEventListener("click", function(){ set(false); }); });
    document.addEventListener("keydown", function(e){ if (e.key === "Escape") set(false); });
    var css = document.createElement("style");
    css.textContent = ""
      + ".adp-burger{display:none}"
      + ".adp-burger svg{width:24px;height:24px}"
      + "@media(max-width:900px){"
      +   ".adp-burger{display:inline-grid;place-items:center;width:40px;height:40px;border:none;background:none;cursor:pointer;color:var(--ink,#18181b);flex:none;padding:0}"
      +   ".top{grid-template-columns:auto 1fr auto!important}"
      +   ".top .search{display:none}"
      +   ".top .logo{white-space:nowrap;min-width:0}"
      +   ".side.adp-drawer{display:flex!important;position:fixed;top:0;left:0;bottom:0;width:82%;max-width:300px;z-index:60;background:var(--bg,#f1f1f1);box-shadow:2px 0 24px rgba(16,16,16,.18);transform:translateX(-102%);transition:transform .22s ease;padding:20px 18px;overflow-y:auto;margin:0}"
      +   "body.adp-navopen .side.adp-drawer{transform:none}"
      +   ".adp-navov{display:none;position:fixed;inset:0;background:rgba(16,16,16,.42);z-index:55}"
      +   "body.adp-navopen .adp-navov{display:block}"
      +   "body.adp-navopen{overflow:hidden}"
      + "}";
    document.head.appendChild(css);
  })();

  // expõe (caso queira chamar de outro lugar)
  window.ADP_UI = { suporte: openSuporte, sugestao: openSugestao, perfil: openPerfil, toast: toast };
})();
