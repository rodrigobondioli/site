// Quadro de desenho (Excalidraw) para os exercícios que são espaciais, não textuais.
//
// Alguns exercícios do método NÃO são formulário — são desenho na parede: o alvo do
// Radar de Players, o Mapa do Sprint com setas, os arcos do Aaker, o Canvas em nove blocos.
// Transformar isso em campo de texto mata o exercício.
//
// Sem build: React + Excalidraw vêm por CDN em UMD. A cena inteira é salva como JSON
// no mesmo campo jsonb que já guarda listas e tabelas.
(function () {
  const CDN = [
    'https://unpkg.com/react@18.2.0/umd/react.production.min.js',
    'https://unpkg.com/react-dom@18.2.0/umd/react-dom.production.min.js',
    'https://unpkg.com/@excalidraw/excalidraw@0.17.6/dist/excalidraw.production.min.js',
  ];
  const CSS = 'https://unpkg.com/@excalidraw/excalidraw@0.17.6/dist/excalidraw.production.min.css';

  let carregando = null;

  function script(src) {
    return new Promise((ok, erro) => {
      const s = document.createElement('script');
      s.src = src; s.crossOrigin = 'anonymous';
      s.onload = ok; s.onerror = () => erro(new Error('não carregou ' + src));
      document.head.appendChild(s);
    });
  }

  async function carregar() {
    if (window.ExcalidrawLib) return true;
    if (carregando) return carregando;
    carregando = (async () => {
      const l = document.createElement('link');
      l.rel = 'stylesheet'; l.href = CSS; document.head.appendChild(l);
      for (const src of CDN) await script(src);   // ordem importa: React antes do Excalidraw
      window.EXCALIDRAW_ASSET_PATH = 'https://unpkg.com/@excalidraw/excalidraw@0.17.6/dist/';
      return !!window.ExcalidrawLib;
    })();
    return carregando;
  }

  // Monta o quadro dentro de `el`. Devolve { destruir() }.
  // valor = { elements, appState } salvo antes, ou null.
  async function montar(el, valor, aoMudar, opts = {}) {
    el.innerHTML = `<div class="dw-carregando">carregando o quadro…</div>`;
    let ok = false;
    try { ok = await carregar(); } catch (e) { ok = false; }

    if (!ok || !window.ExcalidrawLib) {
      // Falhar sem tirar o trabalho do usuário: cai para link externo + anotação.
      el.innerHTML = `<div class="dw-falhou">
        <b>Não consegui carregar o quadro aqui.</b>
        Provavelmente a rede bloqueou o CDN. Desenhe no
        <a href="https://excalidraw.com" target="_blank" rel="noopener">excalidraw.com</a>,
        exporte como link e cole abaixo.
        <input type="text" class="dw-link" placeholder="https://excalidraw.com/#json=…">
      </div>`;
      const inp = el.querySelector('.dw-link');
      if (valor && valor.link) inp.value = valor.link;
      inp.addEventListener('input', () => aoMudar({ link: inp.value }));
      return { destruir(){} };
    }

    const { Excalidraw, exportToBlob } = window.ExcalidrawLib;
    const raiz = document.createElement('div');
    raiz.className = 'dw-palco';
    el.innerHTML = ''; el.appendChild(raiz);

    let api = null, tm = null;
    const salvar = () => {
      clearTimeout(tm);
      tm = setTimeout(() => {
        if (!api) return;
        aoMudar({
          elements: api.getSceneElements(),
          appState: { viewBackgroundColor: api.getAppState().viewBackgroundColor },
        });
      }, 900);
    };

    const props = {
      initialData: valor && valor.elements
        ? { elements: valor.elements, appState: { ...(valor.appState||{}), collaborators: [] }, scrollToContent: true }
        : { appState: { viewBackgroundColor: '#ffffff', collaborators: [] } },
      onChange: salvar,
      excalidrawAPI: (a) => { api = a; if (opts.aoPronto) opts.aoPronto(a); },
      langCode: 'pt-BR',
      UIOptions: { canvasActions: { loadScene: false, saveToActiveFile: false } },
    };

    const root = window.ReactDOM.createRoot(raiz);
    root.render(window.React.createElement(Excalidraw, props));

    return {
      destruir(){ clearTimeout(tm); try { root.unmount(); } catch {} },
      api: () => api,
      async png(){
        if (!api || !exportToBlob) return null;
        return exportToBlob({ elements: api.getSceneElements(),
          appState: api.getAppState(), files: api.getFiles(), mimeType: 'image/png' });
      }
    };
  }

  window.NAVE_DESENHO = { montar, carregar };
})();
