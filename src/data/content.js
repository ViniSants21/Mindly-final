/**
 * Conteúdo estático da Trilha de Aprendizagem e dos mini-jogos.
 *
 * O *progresso* do usuário em cada etapa é persistido no Supabase
 * (tabela learning_progress); apenas o conteúdo em si — que é igual
 * para todos — vive aqui no frontend.
 */

export const learningPath = [
  {
    id: 1,
    titulo: "O que é Neurodiversidade?",
    conteudo:
      "Neurodiversidade reconhece que cérebros funcionam de maneiras diferentes. Isso inclui TDAH, autismo, dislexia e outras variações.",
    dica: "Não existe um jeito certo de aprender — existe o seu jeito.",
  },
  {
    id: 2,
    titulo: "Como o cérebro aprende",
    conteudo:
      "O aprendizado acontece com repetição, emoção e prática. Algumas pessoas aprendem melhor visualmente, outras ouvindo ou fazendo.",
    dica: "Teste diferentes métodos e observe o que funciona melhor para você.",
  },
  {
    id: 3,
    titulo: "Estratégias de estudo",
    conteudo:
      "Dividir tarefas, usar cores, mapas mentais e pausas ajudam no foco e evitam sobrecarga.",
    dica: "Estudar menos tempo com qualidade é melhor do que estudar muito sem foco.",
  },
  {
    id: 4,
    titulo: "Ambiente ideal",
    conteudo:
      "Um ambiente organizado, silencioso e confortável melhora muito a concentração.",
    dica: "Pequenas mudanças no ambiente fazem grande diferença.",
  },
  {
    id: 5,
    titulo: "Autoconhecimento",
    conteudo: "Entender como você aprende é essencial para evoluir.",
    dica: "Observe seus padrões — isso é sua maior vantagem.",
  },
];

/**
 * Mini-jogos da página de Desafios.
 * `answer` é a resposta correta (comparada em minúsculas e sem espaços).
 * `reward` é a quantidade de moedas ganhas ao acertar.
 */
export const games = [
  {
    id: "letras",
    title: "Adivinha com letras",
    description:
      "Adivinhe as palavras com as letras embaralhadas e divirta-se aprendendo coisas novas.",
    prompt: "Descubra a palavra secreta.",
    hint: "Fruta vermelha com 7 letras",
    answer: "morango",
    reward: 15,
  },
  {
    id: "matematica",
    title: "Charada matemática",
    description:
      "Resolva charadas de matemática e teste suas habilidades de raciocínio lógico rápido.",
    prompt: "20 passageiros × 3 viagens = ?",
    hint: "Multiplique os dois números",
    answer: "60",
    reward: 15,
  },
  {
    id: "rimas",
    title: "Adivinha com rimas",
    description:
      "Adivinhe as palavras através de rimas criativas e melhore seu conhecimento.",
    prompt: "Tem ponta mas não fere, escreve mas não fala.",
    hint: "Você usa para escrever",
    answer: "caneta",
    reward: 15,
  },
];
