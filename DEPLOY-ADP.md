# Anti Designer Pato — do protótipo ao ar

## O que já está no repo (feito pelo Claude)
- `app/curso/` — as 5 telas reais (home, cursos, aula, canvas, posicionamento), fontes plugadas no `/shared`.
- `app/index.html` — login com **magic-link real** (Supabase) + fallback dev.
- `app/config.js` — config pública (você preenche URL + anon key).
- `app/curso/guard.js` — trava as páginas do curso (sem login → volta pro login).
- `middleware.js` — roteia `app.rodrigobondioli.com/` e `/curso/*`.
- `api/ai/ruminacao.js` — 🧠 Caça à Ruminação (gpt-4o-mini).
- `api/ai/estrategista.js` — 🚀 O Estrategista (gpt-4o).
- `api/canvas.js` — salva/carrega o Canvas.
- `api/webhook/greenn.js` — pagou → libera acesso.
- `supabase/schema.sql` — banco (rodar no Supabase).

## O que DEPENDE de você (6 passos — o Claude não faz por segurança/acesso)

1. **Supabase**: cria projeto → SQL editor → cola o `supabase/schema.sql` e roda.
   - Pega `Project URL`, `anon key` e `service_role key` (Settings → API).
   - Auth → URL Configuration: adiciona `https://app.rodrigobondioli.com` como Site URL e Redirect.

2. **`app/config.js`**: troca `SUPABASE_URL` e `SUPABASE_ANON_KEY` pelos teus (anon é pública, pode commitar).

3. **Vercel → Environment Variables** (Settings → Environment Variables):
   - `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE`
   - `OPENAI_API_KEY`
   - `GREENN_WEBHOOK_SECRET`, `GREENN_PRODUCT_MAP` (ex: `{"1234":"p1-generico-especialista"}`)

4. **Greenn**: aponta o webhook de venda paga pra `https://app.rodrigobondioli.com/api/webhook/greenn`
   (ajustar no `greenn.js` os nomes reais do payload — deixei marcado com ⚠️).

5. **Vídeos (Bunny Stream)**: cria library, sobe os vídeos, troca o poster falso do player em `app/curso/aula.html` pelo embed do Bunny (1 lugar).

6. **Deploy**: `git push` → Vercel builda sozinho. Testa: compra teste no Greenn → recebe magic-link → entra no curso.

## Ordem sugerida
Supabase (1-2) → deploy e testar login → OpenAI + testar as IAs (3) → Greenn (4) → vídeos (5).
