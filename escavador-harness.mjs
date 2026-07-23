// Harness LOCAL do Escavador — prova endpoint/extração/retomada sem subir a UI.
// Uso:  AI_API_KEY=suachave  node escavador-harness.mjs
// (usa a mesma env do app; MODEL_FAST default = gemini-2.5-flash). Arquivo é só teste — pode deletar.
import { escavadorTurn } from './api/ai/escavador.js';

// respostas simuladas do aluno, na ordem (a última é vazia = deixa o Escavador puxar/fechar)
const RESPOSTAS = [
  'Trabalhei 6 anos numa distribuidora de autopeças da família. Conheço dono de loja de peças por dentro — sei que eles vivem com estoque parado e margem apertada.',
  'Sou bom em pegar catálogo bagunçado e virar um que vende. Numa loja fiz o catálogo digital e as vendas de peça parada saíram. Também mando bem em landing page.',
  'Prova: a loja do meu primo tava com 200 itens encalhados. Refiz a ficha de cada um com foto e busca. Em 2 meses ele girou 60% do estoque morto.',
  'Minha virada foi sair da distribuidora e perceber que ninguém falava a língua desse dono. Amo resolver problema de negócio, odeio ficar só "deixando bonito".',
  'Meu medo é que se eu focar em autopeças eu perco os outros clientes e fique sem grana.'
];

function log(t, r) {
  console.log('\n===== TURNO ' + t + ' =====');
  console.log('Escavador:', r.reply);
  console.log('campo_atual:', r.campo_atual, '| done:', r.done);
  console.log('suficiência:', JSON.stringify(r.suficiencia));
  console.log('voce:', JSON.stringify(r.voce, null, 2));
}

async function run() {
  if (!process.env.AI_API_KEY && !process.env.OPENAI_API_KEY) {
    console.error('Falta AI_API_KEY no ambiente. Rode:  AI_API_KEY=suachave node escavador-harness.mjs');
    process.exit(1);
  }
  let voce = {};
  let history = [];

  // turno 0: abertura (sem resposta ainda)
  let r = await escavadorTurn({ history, voce });
  log(0, r); voce = r.voce; history.push({ role: 'assistant', content: r.reply });

  // turnos 1..N: manda cada resposta simulada
  for (let i = 0; i < RESPOSTAS.length; i++) {
    history.push({ role: 'user', content: RESPOSTAS[i] });
    r = await escavadorTurn({ history, voce });
    log(i + 1, r);
    voce = r.voce;
    history.push({ role: 'assistant', content: r.reply });
    if (r.done) { console.log('\n>>> Escavador FECHOU o bloco.'); break; }
  }

  // PROVA DE RETOMADA: reabre a conversa só com o voce salvo (history vazio) — tem que continuar coerente
  console.log('\n\n########## RETOMADA (history vazio, só o voce salvo) ##########');
  const r2 = await escavadorTurn({ history: [], voce });
  log('RETOMADA', r2);
}
run().catch(e => { console.error('ERRO:', e.message); process.exit(1); });
