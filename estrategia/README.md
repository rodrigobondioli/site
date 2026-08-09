# estrategia.rodrigobondioli.com

App de condução de projetos de marca pelo método N.A.V.E. Estático + serverless + Supabase,
o mesmo padrão do `app/` — sem build, sem framework.

## Arquivos

| Arquivo | O que é |
|---|---|
| `index.html` | Painel: lista de projetos, cria cliente + projeto |
| `projeto.html?p=<id>` | Fases, tarefas, âncoras (gates) e atalho para os instrumentos |
| `exercicio.html?ex=<code>&p=<id>` | Formulário de qualquer um dos 61 instrumentos |
| `login.html` | Link mágico (Supabase OTP) |
| `nave.js` | Sessão, chamadas à API, cache do catálogo |
| `config.js` | URL e publishable key do Supabase |
| `ui.css` | Estilo, sobre os tokens do `/shared/shared.css` |
| `prototipo.html` | Protótipo navegável das 7 telas (referência visual, dados falsos) |
| `metodo/` | Playbook do método em HTML + os 16 markdowns + transcrições |
| `data/nave-exercicios.json` | Catálogo em JSON — usado no modo rascunho e no protótipo |

Sem `?p=` na URL, `exercicio.html` roda em **rascunho local** (localStorage), sem login.
Com `?p=<uuid>`, grava no banco.

## Subir o banco (uma vez)

No SQL editor do Supabase, nesta ordem:

1. `supabase/nave-schema.sql` — tabelas, RLS, trigger de âncora
2. `supabase/nave-seed-fases.sql` — 16 fases + 135 tarefas-modelo
3. `supabase/nave-seed-exercicios.sql` — 61 instrumentos + 316 campos

Os três seeds são idempotentes (`on conflict do update`) — pode rodar de novo depois de
mudar `catalog.py` ou `phases.py` sem perder projeto nenhum.

Todas as tabelas têm prefixo `nave_` para conviver com o schema do app do curso no
**mesmo** projeto Supabase.

## Variáveis de ambiente (Vercel)

Reaproveita as que já existem: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE`.
Nada novo. A service role continua fora do repositório.

## Domínio

`middleware.js` (raiz) já tem o branch de host. Falta, no painel da Vercel:
adicionar `estrategia.rodrigobondioli.com` nos domínios do projeto e criar o CNAME no DNS.
Antes do DNS dá para testar em `rodrigobondioli.com/estrategia`.

## A regra que o app existe para impor

`nave_enforce_gate` é um trigger no Postgres, não uma validação de tela: se uma fase-âncora
anterior não estiver com `gate = 'aprovado'`, o banco **recusa** marcar a fase seguinte como
em andamento ou concluída. A mensagem sobe até o toast. Projeto ancorado não afunda.
