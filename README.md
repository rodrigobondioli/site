# Rodrigo Bondioli - mapa do projeto

Este repositorio concentra quatro frentes publicas/privadas do ecossistema:

## 1. Site principal

- URL: https://www.rodrigobondioli.com/
- Entrada: `index.html`
- Apoio: `shared/`, `img/`, `docs/design.md`
- Funcao: site pessoal/portfolio do Rodrigo Bondioli.

## 2. Landing oficial do curso low ticket

- URL: https://www.rodrigobondioli.com/antipato
- Pasta: `antipato/`
- Funcao: pagina de vendas oficial do curso Anti Designer Pato / De Generico a Especialista.
- Observacao: esta e a versao principal para copy, checkout, SEO e imagem social.

## 3. Landing antiga/secundaria do curso

- URL: https://www.rodrigobondioli.com/quak
- Pasta: `quak/`
- Funcao: versao secundaria/legada da landing do curso.
- Observacao: manter enquanto a URL ainda for util, mas nao tratar como fonte principal.

## 4. App do curso

- URL principal esperada: https://app.rodrigobondioli.com/
- Frontend: `app/`
- APIs serverless: `api/`
- Banco e policies: `supabase/`
- Funcao: plataforma do curso, no estilo comunidade/app fechado, com login, aulas, progresso, Canvas e IA.

## Rotas importantes do app

- `/` em `app.rodrigobondioli.com`: login (`app/index.html`)
- `/curso`: home do curso (`app/curso/home.html`)
- `/curso/aula.html`: player/aula/exercicio
- `/curso/canvas.html`: Canvas do aluno
- `/curso/posicionamento.html`: geracao/refino do posicionamento com IA
- `/admin`: painel interno de aulas e alunos

O roteamento limpo do subdominio do app fica em `middleware.js`.

## Pastas internas e descarte

- `docs/`: documentacao operacional e referencias do projeto.
- `tools/`: scripts internos de desenvolvimento/teste.
- `Marketing/`: documentos internos de copy, criativos e estrategia. Nao publicar.
- `Marketing/anti-pato/`: acervo interno organizado do produto Anti Pato, importado da pasta externa antiga.
- `_to_delete/`: descarte local ignorado pelo Git.
- `_to_delete_git_locks/`: residuos antigos de locks, ja marcado para sair do controle de versao.
- `design-system/`: referencia visual/prototipos.

## Arquivos que ficam na raiz

- `index.html`: pagina inicial publica do dominio principal.
- `politica-de-privacidade.html` e `termos.html`: paginas legais publicas com URLs diretas usadas pelas landings.
- `middleware.js`: roteamento do subdominio do app na Vercel.
- `vercel.json`: configuracao de headers/cache/deploy.
- `README.md`: mapa do repositorio.

## Deploy

O projeto atual roda como site estatico + funcoes serverless na Vercel.

- Configuracao: `vercel.json`
- Variaveis esperadas no ambiente: Supabase, Resend, IA, Greenn e admins.
- O app depende de Supabase para autenticacao, controle de acesso, progresso, Canvas e planos.

## Cuidados antes de mexer

- Nao mover `antipato/`, `quak/`, `app/`, `api/` ou `shared/` sem ajustar URLs absolutas e o deploy.
- A landing oficial e `antipato/`; `quak/` e legado.
- O app pago deve checar acesso do aluno nas APIs, nao so no frontend.
- Chave anon/publishable do Supabase pode ficar no cliente; service role e chaves de IA/Resend nunca devem entrar no repositorio.
