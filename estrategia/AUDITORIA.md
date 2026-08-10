# Auditoria — app de Estratégia de Marca

Percurso completo das rotas como usuário real, inspeção do front-end e da camada de dados.
Data do corte: commit atual em `estrategia/`.

---

## 1. Escopo

**Rotas:** `login.html` → `index.html` (Marcas) → `marca.html` (canvas + painel + folha de exercício).
**Camada de dados:** `nave.js` falando direto com PostgREST/Supabase, sem backend próprio.
**Regras de negócio no banco:** RLS por `owner = auth.uid()` e trigger `nave_enforce_gate` que recusa
avançar sem aprovação registrada.

**Jornadas percorridas:** primeiro acesso · criar marca · executar passo · rodar exercício ·
marcar não-se-aplica · concluir passo · registrar aprovação · reabrir passo · excluir marca ·
voltar dias depois · sessão expirada · marca inexistente · CDN do quadro fora do ar.

---

## 2. Matriz de severidade

| | Critério | Achados |
|---|---|---|
| **P0** | Perde trabalho do usuário ou deixa a tela sem saída | 7 — **todos corrigidos nesta rodada** |
| **P1** | Bloqueia a tarefa ou induz a registrar dado falso | 6 |
| **P2** | Fricção real, custa tempo ou confiança | 8 |
| **P3** | Polimento | 5 |

---

## 3. P0 — corrigidos agora

### P0.1 · O exercício dizia "Feito ✓" e o banco não sabia
**Causa raiz.** `nave.js`, rota `resposta`: `if (!rows.length) return` acontecia **antes** de aplicar
o status. Exercício sem campo preenchido gerava zero linhas e a função saía sem tocar em
`nave_project_exercises`.
**Evidência.** 6 dos 61 exercícios são só quadro (Canvas do Modelo de Negócio, O Mapa, Mapa de Empatia,
Radar de Players, Escada da Marca, Universo da Marca). Neles `rows.length` é sempre 0.
**Consequência.** Você desenha o Radar de Players na frente do cliente, clica em "Marcar como feito",
a interface confirma. No dia seguinte o exercício está zerado, o card não conta e a tarefa não fecha.
**Reprodução.** Abrir V7 → não digitar nada → "Marcar como feito" → recarregar.
**Correção.** Status virou operação independente das respostas.

### P0.2 · Toda vez que você tirava um exercício da sessão, apagava a justificativa
**Causa raiz.** Rota `selecao` montava o payload com `rationale: i.rationale ?? null`. Como a UI nunca
manda esse campo, o upsert gravava `null` por cima do que existisse.
**Consequência.** O método manda escolher os exercícios do workshop **com justificativa** — é o que
sustenta sua condução na sala. O campo existe no banco, e qualquer coisa que fosse escrita ali seria
destruída no próximo clique no `+`. Bomba armada para a feature que ainda vou construir.
**Correção.** O payload só carrega colunas presentes.

### P0.3 · Sessão expirada virava uma parede de toasts
**Causa raiz.** `guard()` só roda no boot. Depois disso, token expirado devolvia erro do PostgREST em
cada save, tratado como erro genérico.
**Consequência.** Workshop de 4h35. Na terceira hora o token expira. Cada campo digitado mostra um
toast vermelho e some. Você continua trabalhando achando que salvou. Nada foi salvo.
**Correção.** `ok()` detecta erro de autenticação, guarda onde você estava e manda pro login com aviso
explícito: *"Sua sessão expirou no meio do trabalho. Entre de novo — nada do que você salvou se perdeu."*

### P0.4 · Marca inexistente = tela branca
**Causa raiz.** `catch (e) { toast(e.message) }` no boot de `marca.html`. Toast some em 4,5s e sobra
uma tela vazia sem nenhum controle.
**Consequência.** Beco sem saída absoluto. Acontece ao abrir um link antigo, ao voltar depois de
excluir a marca, ou em qualquer falha de rede no carregamento.
**Correção.** Tela de erro com diagnóstico, "Tentar de novo" e "Voltar para Marcas".

### P0.5 · Fechar a aba no meio do autosave perdia o último bloco
**Causa raiz.** Autosave com debounce de 800ms e nenhum guard de saída.
**Consequência.** Terminou de digitar a resposta do fundador, fechou o notebook, perdeu.
**Correção.** `beforeunload` bloqueia enquanto houver gravação pendente.

### P0.6 · O link do quadro sumia quando o Excalidraw voltava a carregar
**Causa raiz.** Quando o CDN falha, o fallback grava `{link:"https://excalidraw.com/#json=…"}` no campo.
Na sessão seguinte, com o CDN no ar, `montar()` recebia um valor sem `elements`, abria em branco, e o
primeiro traço sobrescrevia o campo inteiro com `{elements}`.
**Consequência.** Perde o único ponteiro para o desenho que você fez fora do app.
**Correção.** O valor novo é mesclado sobre o antigo em vez de substituí-lo.

### P0.7 · Catálogo em cache eterno
**Causa raiz.** `sessionStorage['nave:catalogo']` só era limpo no logout.
**Consequência.** É exatamente o que aconteceu com você hoje: rodei o seed, você recarregou, continuou
vendo os nomes antigos e concluiu que não tinha funcionado.
**Correção.** Chave versionada + validade de 30 minutos.

---

## 4. P1 — abertos, bloqueiam tarefa ou sujam o dado

### P1.1 · Passo travado por aprovação não diz o que fazer
**Onde.** `marca.html`, `D.trava`.
**O que acontece.** Passos depois de um gate pendente recebem a classe `trava` e nada mais. O botão
"Concluir passo" continua habilitado, você clica, e o trigger do Postgres recusa com uma mensagem
técnica num toast.
**Cenário.** Você fecha o Diagnóstico sem registrar a aprovação, avança para Redação da estratégia,
resolve os 11 itens, clica em concluir. Erro incompreensível. Nada indica que o problema está três
passos atrás.
**Correção proposta.** No painel do passo travado, substituir o rodapé por: *"Travado até o cliente
aprovar o Diagnóstico"* + botão que leva direto ao passo do gate. E desabilitar o Concluir.

### P1.2 · Auto-conclusão dispara no meio da digitação e nunca volta atrás
**O que acontece.** `completo()` fica verdadeiro no instante em que o último campo recebe **um
caractere**. O exercício é marcado como feito, a tarefa se marca sozinha, e nenhum dos dois desmarca
se você apagar depois.
**Consequência.** Contador infla. O card diz 7/7 exercícios com metade escrita pela metade. O dado
que você mostra pro cliente deixa de ser confiável.
**Correção proposta.** Exigir conteúdo mínimo (ex.: 3 caracteres por campo) e só promover quando o
exercício perder o foco ou a folha fechar, não a cada tecla.

### P1.3 · "Preenchido" aceita tabela com uma célula
**O que acontece.** Para campo tipo tabela, `temValor()` devolve verdadeiro se **qualquer** célula
tiver texto. A Matriz de Concorrentes tem 7 colunas × N linhas e conta como completa com uma célula.
**Correção proposta.** Para tabela, exigir pelo menos uma linha com todas as colunas obrigatórias.

### P1.4 · Não dá para remover linha de tabela
**O que acontece.** Existe "+ linha" e não existe remover.
**Cenário.** Clicou 8 vezes sem querer no meio da sessão. Fica com 8 linhas vazias para sempre, e elas
entram no cálculo de preenchimento.
**Correção proposta.** ✕ por linha, aparecendo no hover.

### P1.5 · Reabrir passo antigo joga o "agora" para trás sem avisar
**O que acontece.** `agora()` é o primeiro passo não concluído. Reabrir o passo 2 quando você está no
passo 9 faz o topo dizer "passo 2 de 16" e o nó lima pular para trás.
**Consequência.** Parece que o app perdeu seu progresso.
**Correção proposta.** Confirmação explicando o efeito, ou desacoplar "onde estou" de "primeiro em
aberto" guardando um ponteiro próprio.

### P1.6 · Excluir marca é um clique de distância de uma perda irreversível
**O que acontece.** ✕ no card → diálogo → "Excluir para sempre". Sem digitar o nome, sem desfazer,
sem lixeira. O botão destrutivo é o mais visível do diálogo.
**Correção proposta.** Exigir digitar o nome da marca, ou soft delete com `deleted_at` e 30 dias de
recuperação. O segundo é melhor e custa uma coluna.

---

## 5. P2 — fricção

| # | Achado | Consequência | Correção |
|---|---|---|---|
| P2.1 | Canvas não responde a toque (`mousedown` apenas) | Em iPad, o mapa não pana nem dá zoom — e iPad é o cenário natural de workshop | Adicionar `touchstart/touchmove` e pinça |
| P2.2 | "não se aplica" só aparece no hover | Invisível em touch e indescobrível | Deixar sempre visível em opacidade baixa |
| P2.3 | Passo aberto não vai para a URL | Não dá para mandar link de um passo; o Voltar do navegador sai do app inteiro | `history.pushState` com `?p=…&passo=…` |
| P2.4 | Sem estado de carregamento | Tela vazia por 1–2s no boot, parece quebrada | Esqueleto dos 16 nós |
| P2.5 | "salvando…/salvo" em cinza 12px no canto | Numa sessão com cliente você não tem certeza de que salvou | Indicador maior, e persistente por alguns segundos |
| P2.6 | Falha de rede num save só produz um toast | Nenhum retry; o dado fica só na memória | Fila de retry com backoff e badge "N alterações não salvas" |
| P2.7 | Duas abas abertas se sobrescrevem | Última escrita ganha, silenciosamente | Detectar `updated_at` divergente, ou Supabase Realtime |
| P2.8 | Contraste do texto cinza `--i28` ≈ 2,2:1 | Abaixo do mínimo de 4,5:1; ilegível em tela de projeção | Subir para `--i50` nos textos, deixar `--i28` só em ornamento |

---

## 6. P3 — polimento

1. Botões de ícone sem `aria-label` (✕, +, ←, não se aplica).
2. Checkbox é `<span>` dentro de `<button>`, sem `role="checkbox"` nem `aria-checked` — leitor de tela não anuncia estado.
3. Canvas não é navegável por teclado; `Tab` percorre 16 nós sem indicação visual de foco.
4. Diálogo de exclusão sem foco inicial e sem trap de foco.
5. Painel do exercício em telas <900px empilha e o quadro fica com poucos pixels de altura.

---

## 7. Riscos sistêmicos (não são bugs, são o próximo incêndio)

**CSS global sem namespace.** Já produziu um defeito real hoje: `<b class="tudo">` começou como
`class="full"` e colidiu com `.full` (a folha do exercício, `position:fixed`), fazendo o número "1/1"
voar para fora do card. O arquivo tem `.ex` significando duas coisas diferentes e `.b`, `.mt`, `.nm`,
`.tp` como nomes de uma letra. **Prefixar por bloco** antes que isso morda de novo.

**Estado só na memória.** `D` é a fonte de verdade da tela e não tem versão. Todo optimistic update
faz rollback à mão, um por um. À medida que as regras crescem (auto-check, sincronizar, trava), a
chance de a tela divergir do banco cresce junto. Vale um `recarregar()` silencioso após operações
que mexem em cadeia.

**Regra de negócio duplicada.** A trava do gate existe no trigger do Postgres **e** em `D.trava` no
JS. Já estão fora de sincronia: o JS trava a partir do gate pendente, o Postgres recusa a transição.
Uma das duas vai mentir.

---

## 8. O que eu faria, em ordem

**Onda 1 — confiabilidade (P1.1, P1.2, P1.4, P1.6, P2.6)**
O app precisa sobreviver a um workshop de quatro horas com cliente na sala. Travar o que trava, não
mentir sobre o que está preenchido, não perder o que foi digitado.

**Onda 2 — o app na sala (P2.1, P2.2, P2.5, P2.8, P3.5)**
Toque, contraste e feedback. Enquanto o canvas não pana no iPad, o app é de escritório, não de sessão.

**Onda 3 — navegação e escala (P2.3, P2.7, riscos sistêmicos)**
URL por passo, conflito entre abas, namespace de CSS. É o que separa "ferramenta minha" de
"ferramenta que aguenta um segundo cliente ao mesmo tempo".

---

## 9. O que está sólido

Vale registrar, porque é o que não precisa mexer:

- **A trava de aprovação funciona de verdade.** Está no banco, não na interface. Testada em produção:
  o Postgres recusou concluir um passo com âncora pendente.
- **RLS verificada.** Sessão anônima devolve zero linha em todas as tabelas.
- **O modelo de três estados por item** (feito / não se aplica / em aberto) elimina a mentira que
  existia antes. É a decisão de produto mais forte tomada até aqui.
- **Contexto em toda tarefa.** As 135 têm uma linha de explicação. É o que faz o app ser usável por
  alguém que não decorou o método.
- **Recuperação por seed.** Os textos vivem em `phases.py` / `catalog.py` / `detalhes.py` e são
  regeneráveis. Errar um texto não é perda, é `python3 phases.py`.
