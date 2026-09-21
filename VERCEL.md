# Deploy e DNS — passo a passo

## 1. Vercel

O repo agora é um projeto Next.js. A Vercel detecta sozinha:

- Framework: **Next.js** (auto)
- Build: `next build` (auto)
- Output: `out/` (por causa do `output: "export"` no next.config.mjs)

**Atenção:** o `vercel.json` antigo tem `headers` e `redirects` apontando
para `/quak/`, `/mateopato/` e `/antipato` — caminhos que deixaram de existir.
Não quebram nada, mas viram regra morta. Limpar quando der.

## 2. DNS no Hostinger

O domínio aponta pro Framer hoje. Na Hostinger, em **DNS / Nameservers**:

| Tipo | Nome | Valor |
|---|---|---|
| A | `@` | `76.76.21.21` |
| CNAME | `www` | `cname.vercel-dns.com` |

Apague os registros que apontam pro Framer antes de criar esses.

Propagação costuma levar de minutos a algumas horas. A Vercel emite o
certificado SSL sozinha depois que o DNS resolve.

⚠️ **`app.rodrigobondioli.com`** — se ainda existir um registro pra esse
subdomínio, ele para de funcionar quando a plataforma sair do repo.
Era isso que você pediu, só não pode ser surpresa.

## 3. Ordem recomendada

1. `bash MIGRAR.sh` (cria a branch, não faz push)
2. `git log --stat -1` pra conferir o que saiu
3. `git push -u origin site-novo`
4. Na Vercel, apontar o projeto pra branch `site-novo` OU mergear em main
5. Conferir o deploy na URL que a Vercel der
6. Só então mexer no DNS da Hostinger
