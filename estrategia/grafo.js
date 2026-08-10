// Camada de sustentação do método: o que alimenta o quê.
//
// Não é o fluxo (isso já existe). É a rede de evidência: quais exercícios
// sustentam cada conclusão da estratégia, e quais conclusões formam cada entrega.
//
// Código com "?" no fim = INFERÊNCIA minha, não está explícito no material.
// A tela mostra essas arestas mais fracas, para você saber onde está pisando em achismo.
window.NAVE_GRAFO = {

  // --- conclusões: onde o conteúdo mora de fato (exercício + campo) ---
  conclusoes: [
    { id:'proposito', nome:'Propósito', fonte:{ ex:'ES3', campo:'proposito' },
      de:['E7','E5','E2','E1'] },

    { id:'valores', nome:'Diretrizes de Valores', fonte:{ ex:'ES1', campo:'valores' },
      de:['E6','E4','E1','E3?'] },

    { id:'personalidade', nome:'Diretrizes de Personalidade', fonte:{ ex:'ES1', campo:'personalidade' },
      de:['E8','E9','E11?','E3?','E10?'] },

    { id:'promessa', nome:'Promessa / Transformação', fonte:{ ex:'ES1', campo:'promessa' },
      de:['V1','V2','V9','V11','V12','V10?','A4?'] },

    { id:'oportunidades', nome:'Oportunidades de Mercado', fonte:{ ex:'ES1', campo:'oportunidades' },
      de:['DG2','V14','V7','V13','DG3','N3','V5','N4','A5?'] },

    { id:'mensagens', nome:'Principais Mensagens', fonte:{ ex:'ES1', campo:'mensagens' },
      de:['V8','A4','V6?','V4?','E4?'] },

    { id:'posicionamento', nome:'Declaração de Posicionamento', fonte:{ ex:'ES1', campo:'posicionamento' },
      de:['V8','V7','V12','V13','V14','A1','A2','A3','DG2','V3?','V1?'] },

    { id:'plataforma', nome:'Plataforma de Marca', fonte:{ ex:'ES3' },
      de:['@proposito','@posicionamento','@valores','@personalidade','@promessa','@mensagens','A3','V13'] },

    // --- verbal ---
    { id:'narrativa', nome:'Narrativa da Marca', fonte:{ ex:'VB1', campo:'texto' },
      de:['E1','E10','E5','@proposito','@promessa','@posicionamento'] },

    { id:'voz', nome:'Voz e Tons', fonte:{ ex:'VB2' },
      de:['E8','E9','@personalidade'] },

    { id:'dicionario', nome:'Dicionário da Marca', fonte:{ ex:'VB3' },
      de:['V14','@mensagens','@voz'] },

    { id:'nome', nome:'Nome Escolhido', fonte:{ ex:'NM3' },
      de:['NM1','NM2','@posicionamento','@personalidade?'] },

    // --- visual ---
    { id:'conceito', nome:'Conceito Criativo', fonte:{ ex:'VS1' },
      de:['@posicionamento','@personalidade','@promessa','E11?'] },

    { id:'keyvisual', nome:'Key Visual', fonte:{ ex:'VS3' },
      de:['@conceito','VS2'] },
  ],

  // --- entregas: os cinco documentos que o cliente recebe ---
  entregas: [
    { id:'d_diag', nome:'Diagnóstico', fase:'F6',
      de:['DG1','DG4','DG2','DG3','PD1','PD2','C1','N1','N2','N3','N4','N5','N6','N7',
          'V3','V5','V6','A1','A2','A3','A4','A5','E1','E3'] },

    { id:'d_estr', nome:'Estratégia', fase:'F9',
      de:['@promessa','@personalidade','@valores','@proposito','@oportunidades',
          '@mensagens','@posicionamento','@plataforma','ES2'] },

    { id:'d_disc', nome:'Discurso da Marca', fase:'F12',
      de:['@narrativa','@voz','@dicionario','@nome','VB7','VB4','VB5?','VB6?'] },

    { id:'d_ident', nome:'Sistema de Identidade', fase:'F14',
      de:['@conceito','@keyvisual','VS2'] },

    { id:'d_guia', nome:'Guia de Marca', fase:'F15',
      de:['#d_diag','#d_estr','#d_disc','#d_ident','GM1'] },
  ],

  // quantas fontes o método espera para cada conclusão não ficar no achismo
  minimo: { posicionamento:4, promessa:3, oportunidades:3, mensagens:2,
            personalidade:2, valores:2, proposito:2, plataforma:5,
            narrativa:2, voz:2, dicionario:2, nome:2, conceito:2, keyvisual:1 },
};
