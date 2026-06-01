/**
 * Conteúdo estático da Trilha de Aprendizagem e dos mini-jogos.
 *
 * O *progresso* do usuário em cada etapa é persistido no Supabase
 * (tabela learning_progress); apenas o conteúdo em si — que é igual
 * para todos — vive aqui no frontend.
 */

export const learningPath = [
  /* ────────────────── MÓDULO 1 ────────────────── */
  {
    id: 1,
    titulo: "Introdução à Neurodiversidade",
    icon: "brain",
    nivel: "Fácil",
    tempo: "5 min",
    xp: 20,
    conteudo:
      "Neurodiversidade é o conceito que reconhece e celebra as variações naturais no funcionamento do cérebro humano. O termo foi criado pela socióloga australiana Judy Singer, em 1998, para descrever diferenças neurológicas como o autismo, TDAH, dislexia e outras condições como variações normais — não como defeitos.\n\nEssas diferenças influenciam como as pessoas pensam, aprendem, se comunicam e percebem o mundo. Cada cérebro é único e traz suas próprias forças e desafios. Compreender a neurodiversidade é o primeiro passo para construir uma sociedade mais inclusiva, empática e justa.",
    curiosidade:
      "Estima-se que 15% a 20% da população mundial seja neurodivergente — isso significa que 1 em cada 5 pessoas tem um funcionamento neurológico diferente do considerado padrão.",
    exemploPratico:
      "Um estudante autista pode ter dificuldade com interações sociais em grupo, mas ser extraordinariamente detalhista e focado em tarefas que envolvem padrões e lógica.",
    dica: "Não existe um jeito certo de aprender — existe o seu jeito. Conhecer seu perfil cognitivo é a base de todo aprendizado eficaz.",
  },

  /* ────────────────── MÓDULO 2 ────────────────── */
  {
    id: 2,
    titulo: "Como o Cérebro Aprende",
    icon: "lightning",
    nivel: "Fácil",
    tempo: "7 min",
    xp: 25,
    conteudo:
      "O aprendizado acontece quando o cérebro forma e fortalece conexões entre neurônios — um processo chamado neuroplasticidade. Cada nova informação cria um caminho neural, e a repetição torna esse caminho mais forte e rápido.\n\nAlgumas pessoas aprendem melhor de forma visual (imagens, gráficos), outras de forma auditiva (explicações, podcasts) e outras de forma cinestésica (fazendo, tocando, experimentando). Emoção, contexto e relevância pessoal aumentam muito a retenção — o cérebro prioriza informações que parecem importantes para sobrevivência ou felicidade.",
    curiosidade:
      "O sono é fundamental para consolidar o aprendizado: durante o sono profundo, o cérebro transfere informações da memória de curto prazo para a memória de longo prazo.",
    exemploPratico:
      "Estudar matemática com exemplos do cotidiano (como calcular o troco ou dividir a conta) ativa mais áreas do cérebro do que decorar fórmulas abstratas, aumentando a retenção.",
    dica: "Teste diferentes métodos e observe o que funciona melhor para você. Combinar visual + cinestésico costuma ser especialmente eficaz para quem tem TDAH ou dislexia.",
  },

  /* ────────────────── MÓDULO 3 ────────────────── */
  {
    id: 3,
    titulo: "TEA — Transtorno do Espectro Autista",
    icon: "star",
    nivel: "Médio",
    tempo: "10 min",
    xp: 30,
    conteudo:
      "O Transtorno do Espectro Autista (TEA) é uma condição neurológica que afeta a forma como uma pessoa percebe e interage com o mundo. O termo 'espectro' reflete a enorme diversidade de perfis — não há dois autistas iguais.\n\nAlgumas características comuns incluem: diferenças na comunicação social, preferência por rotinas, sensibilidades sensoriais (sons, texturas, luzes) e interesses muito intensos em áreas específicas. Muitas pessoas autistas têm habilidades extraordinárias em memória, lógica, música, matemática ou arte.\n\nO diagnóstico precoce e o suporte adequado fazem uma diferença enorme no desenvolvimento e na qualidade de vida.",
    curiosidade:
      "O físico Alan Turing, pioneiro da computação moderna, e Nikola Tesla, inventor e engenheiro genial, são frequentemente citados como possíveis exemplos históricos de pessoas no espectro autista.",
    exemploPratico:
      "Em vez de fazer uma entrevista de emprego convencional, algumas empresas criaram processos seletivos adaptados para candidatos autistas — com tarefas práticas no lugar de perguntas sociais — e descobriram talentos excepcionais.",
    dica: "Ao se comunicar com pessoas autistas, prefira linguagem direta e objetiva. Evite sarcasmo e metáforas ambíguas, pois podem ser interpretados literalmente.",
  },

  /* ────────────────── MÓDULO 4 ────────────────── */
  {
    id: 4,
    titulo: "TDAH — Desafios e Potenciais",
    icon: "flame",
    nivel: "Médio",
    tempo: "10 min",
    xp: 30,
    conteudo:
      "O Transtorno do Déficit de Atenção com Hiperatividade (TDAH) é caracterizado por dificuldades persistentes de atenção, impulsividade e, em alguns casos, hiperatividade. No entanto, o TDAH também traz forças únicas: criatividade elevada, capacidade de hiperfoco em atividades de interesse, energia e pensamento não-linear.\n\nExistem três tipos principais: predominantemente desatento, predominantemente hiperativo-impulsivo, e combinado. O TDAH afeta cerca de 5% a 8% das crianças e 2% a 5% dos adultos no mundo.\n\nCom as estratégias certas — organização, pausas regulares, ambientes adequados e, quando necessário, tratamento medicamentoso — pessoas com TDAH podem ser altamente bem-sucedidas.",
    curiosidade:
      "O empresário Richard Branson (Virgin), o nadador Michael Phelps e a chef Jamie Oliver têm TDAH diagnosticado. Todos atribuem parte de seu sucesso à criatividade e energia que o TDAH trouxe às suas vidas.",
    exemploPratico:
      "A Técnica Pomodoro (25 minutos de foco + 5 de pausa) foi desenvolvida para lidar com dificuldades de atenção e é especialmente eficaz para estudantes com TDAH.",
    dica: "Para pessoas com TDAH, dividir tarefas em pequenos passos com recompensas intermediárias ativa o sistema de dopamina e aumenta muito a produtividade.",
  },

  /* ────────────────── MÓDULO 5 ────────────────── */
  {
    id: 5,
    titulo: "Dislexia e o Dom da Leitura",
    icon: "book",
    nivel: "Médio",
    tempo: "8 min",
    xp: 25,
    conteudo:
      "A dislexia é uma diferença neurológica que afeta a capacidade de ler e processar linguagem escrita. Pessoas com dislexia podem trocar letras, ler devagar ou ter dificuldade para decodificar palavras — mas isso não tem relação com inteligência. A maioria possui QI normal ou acima da média.\n\nA dislexia é uma das condições mais comuns do espectro da neurodiversidade, afetando entre 5% e 15% da população. Com suporte adequado — como uso de fontes especiais, audiobooks e mais tempo em avaliações — estudantes com dislexia prosperam.\n\nMuitas pessoas disléxicas desenvolvem habilidades extraordinárias de pensamento visual, resolução de problemas e visão do 'todo'.",
    curiosidade:
      "Albert Einstein, Leonardo da Vinci, Walt Disney e a escritora Agatha Christie são exemplos históricos de pessoas com dislexia que deixaram legados monumentais.",
    exemploPratico:
      "A fonte 'OpenDyslexic', criada especialmente para pessoas com dislexia, modifica o peso das letras para tornar a leitura mais fácil. Muitos e-readers e aplicativos educacionais já a oferecem.",
    dica: "Audiobooks e text-to-speech são ferramentas poderosas para estudantes com dislexia. Ouvir o conteúdo enquanto acompanha o texto acelera a aprendizagem.",
  },

  /* ────────────────── MÓDULO 6 ────────────────── */
  {
    id: 6,
    titulo: "Discalculia — Além dos Números",
    icon: "math",
    nivel: "Médio",
    tempo: "8 min",
    xp: 25,
    conteudo:
      "A discalculia é uma diferença neurológica que afeta a capacidade de compreender e trabalhar com números e conceitos matemáticos. Pessoas com discalculia podem ter dificuldade para lembrar sequências de números, entender conceitos de quantidade, medir tempo ou executar operações básicas.\n\nAssim como a dislexia, a discalculia não indica falta de inteligência — é apenas uma forma diferente de processar informações matemáticas. Afeta cerca de 3% a 6% da população.\n\nEstratégias eficazes incluem o uso de objetos concretos para representar números, calculadoras, tabelas visuais e muito contexto prático nas aprendizagens.",
    curiosidade:
      "Pesquisas indicam que pessoas com discalculia frequentemente compensam com outras habilidades elevadas, como linguagem verbal, criatividade e inteligência emocional.",
    exemploPratico:
      "Em vez de decorar a tabuada de forma abstrata, crianças com discalculia aprendem muito mais usando blocos, dedos, fichas ou aplicativos que tornam os números visíveis e tangíveis.",
    dica: "Se você tem dificuldade com números, use calculadoras sem culpa — são ferramentas, não muletas. O importante é compreender o conceito, não o cálculo em si.",
  },

  /* ────────────────── MÓDULO 7 ────────────────── */
  {
    id: 7,
    titulo: "Inclusão e Acessibilidade",
    icon: "award",
    nivel: "Médio",
    tempo: "10 min",
    xp: 30,
    conteudo:
      "Inclusão vai além de permitir que pessoas com diferenças neurológicas participem de um ambiente — significa adaptar o ambiente para que todos possam participar plenamente. Acessibilidade é o conjunto de recursos, adaptações e práticas que tornam isso possível.\n\nNo contexto educacional, isso inclui: tempo extra em provas, salas com menor estimulação sensorial, materiais em formatos variados (visual, auditivo, tátil), tecnologias assistivas e professores capacitados.\n\nNo Brasil, a Lei Brasileira de Inclusão (LBI, 2015) e a Política Nacional de Educação Especial garantem esses direitos. Conhecer seus direitos é o primeiro passo para exigi-los.",
    curiosidade:
      "Países como Dinamarca, Holanda e Canadá lideram mundialmente em práticas de educação inclusiva, com resultados acadêmicos superiores para todos os alunos — não apenas os neurodivergentes.",
    exemploPratico:
      "Uma escola que oferece fones de ouvido para alunos com hipersensibilidade sonora, permite sentar longe de janelas para alunos com TDAH e usa letras maiores para disléxicos não está fazendo favor — está cumprindo com direitos fundamentais.",
    dica: "Se você é neurodivergente, pesquise sobre a Lei Brasileira de Inclusão (Lei 13.146/2015) e saiba quais adaptações você tem direito a exigir em escolas e concursos.",
  },

  /* ────────────────── MÓDULO 8 ────────────────── */
  {
    id: 8,
    titulo: "Comunicação Inclusiva",
    icon: "lightbulb",
    nivel: "Fácil",
    tempo: "7 min",
    xp: 20,
    conteudo:
      "Comunicação inclusiva é a prática de adaptar a forma como nos expressamos para garantir que todos possam entender e participar. Isso é especialmente importante ao interagir com pessoas neurodivergentes, que podem processar informações de formas diferentes.\n\nPrincípios básicos: use linguagem simples e direta; evite sarcasmo e ironia quando não estiver claro; dê tempo para a pessoa processar e responder; prefira comunicação escrita quando necessário; pergunte sobre preferências de comunicação em vez de assumir.\n\nComunicação aumentativa e alternativa (CAA) inclui pranchas de comunicação, aplicativos e símbolos visuais que ajudam pessoas com dificuldades de fala a se expressar.",
    curiosidade:
      "O aplicativo Proloquo2Go, usado por pessoas autistas não-verbais, já ajudou milhares de pessoas a se comunicarem pela primeira vez na vida com seus familiares.",
    exemploPratico:
      "Em vez de dizer 'Está tudo bem?' (pergunta vaga), diga 'Você está com dor? Está com fome? Está com medo?' — perguntas específicas facilitam muito a comunicação com pessoas autistas.",
    dica: "Ao falar com alguém neurodivergente, aguarde 5 a 10 segundos após fazer uma pergunta antes de reformulá-la. Muitos precisam desse tempo extra para processar.",
  },

  /* ────────────────── MÓDULO 9 ────────────────── */
  {
    id: 9,
    titulo: "Empatia e Respeito às Diferenças",
    icon: "trophy",
    nivel: "Fácil",
    tempo: "7 min",
    xp: 20,
    conteudo:
      "Empatia é a capacidade de reconhecer e compreender as emoções e perspectivas dos outros. No contexto da neurodiversidade, ela exige um passo extra: tentar entender como o mundo parece para alguém cujo cérebro funciona de forma diferente do nosso.\n\nRespeito às diferenças começa com educação — aprender sobre as condições que outros carregam, abandonar estereótipos e resistir ao impulso de comparar comportamentos com o 'padrão'. Cada pessoa tem uma história, um conjunto de desafios e forças únicas.\n\nAmbientes empáticos — em casa, na escola e no trabalho — reduzem a ansiedade de pessoas neurodivergentes e permitem que elas sejam quem realmente são, sem se mascarar.",
    curiosidade:
      "O 'mascaramento' (masking) é o processo pelo qual pessoas neurodivergentes — especialmente autistas — disfarçam suas características para se encaixar socialmente. Isso é extremamente desgastante e aumenta o risco de burnout e depressão.",
    exemploPratico:
      "Quando uma criança autista tem uma 'crise' no supermercado por causa de sons altos, ela não está 'fazendo birra' — está sofrendo com sobrecarga sensorial. A empatia começa por entender isso.",
    dica: "Antes de reagir ao comportamento de alguém, pergunte-se: 'Qual dificuldade essa pessoa pode estar enfrentando que eu não consigo ver?' Essa pausa muda tudo.",
  },

  /* ────────────────── MÓDULO 10 ────────────────── */
  {
    id: 10,
    titulo: "Mitos e Verdades sobre Neurodiversidade",
    icon: "target",
    nivel: "Médio",
    tempo: "10 min",
    xp: 30,
    conteudo:
      "Existem muitos mitos sobre neurodiversidade que prejudicam pessoas neurodivergentes, atrasam diagnósticos e dificultam a inclusão. Vamos desmistificar os mais comuns:\n\n❌ MITO: Autismo é causado por vacinas. ✅ VERDADE: Estudos com milhões de crianças nunca encontraram essa relação. O mito surgiu de um artigo científico falso publicado em 1998 e retratado pela revista.\n\n❌ MITO: TDAH é desculpa para preguiça. ✅ VERDADE: TDAH envolve diferenças reais no funcionamento do córtex pré-frontal e nos sistemas de dopamina e noradrenalina.\n\n❌ MITO: Pessoas autistas não têm empatia. ✅ VERDADE: Muitas têm empatia intensa — apenas expressam e processam diferente.\n\n❌ MITO: Dislexia significa ver letras invertidas. ✅ VERDADE: É uma dificuldade fonológica — o problema está no processamento dos sons da linguagem, não na visão.",
    curiosidade:
      "A Organização Mundial da Saúde (OMS) removeu o autismo da lista de 'doenças' em 2022, classificando-o como uma condição do neurodesenvolvimento — um passo importante para combater o estigma.",
    exemploPratico:
      "Um professor que entende que um aluno com TDAH esquece o dever de casa por dificuldade de memória de trabalho — não por preguiça — vai usar cadernos de recado, alertas e sistemas de checklist em vez de punições.",
    dica: "Quando ouvir um mito sobre neurodiversidade, resista à tentação de ignorar. Um comentário educativo gentil pode mudar perspectivas e ajudar alguém que está sendo prejudicado por desinformação.",
  },

  /* ────────────────── MÓDULO 11 ────────────────── */
  {
    id: 11,
    titulo: "Neurodiversidade no Mercado de Trabalho",
    icon: "trending",
    nivel: "Avançado",
    tempo: "12 min",
    xp: 40,
    conteudo:
      "O mercado de trabalho está gradualmente reconhecendo o valor da neurodiversidade. Empresas como SAP, Microsoft, JP Morgan e EY têm programas específicos de contratação de profissionais neurodivergentes, descobrindo que eles trazem perspectivas únicas, atenção a detalhes, criatividade e comprometimento excepcionais.\n\nDesafios comuns incluem: processos seletivos com dinâmicas sociais que desfavorecem autistas e introvertidos; ambientes open space barulhentos que prejudicam quem tem TDAH ou hipersensibilidade; falta de flexibilidade de horários e formatos de trabalho.\n\nAdaptações simples — como trabalho remoto, comunicação principalmente por escrito, fones de ouvido, instruções claras e mentorias individuais — podem ser a diferença entre um colaborador mediano e um colaborador excepcional.",
    curiosidade:
      "A SAP, gigante de tecnologia, tem uma iniciativa chamada 'Autism at Work' e descobriu que colaboradores autistas em áreas de teste de software encontravam bugs que os demais testadores humanos e ferramentas automatizadas não detectavam.",
    exemploPratico:
      "Um profissional com TDAH pode ser um vendedor extraordinário graças à energia e criatividade, mas ter dificuldade com relatórios e prazos. Uma solução simples: um assistente para a parte burocrática libera seu potencial principal.",
    dica: "Se você é neurodivergente e está buscando emprego, pesquise empresas com programas de diversidade cognitiva. Muitas consideram isso um diferencial — não uma desvantagem.",
  },

  /* ────────────────── MÓDULO 12 ────────────────── */
  {
    id: 12,
    titulo: "Estratégias de Apoio e Autocuidado",
    icon: "medal",
    nivel: "Avançado",
    tempo: "15 min",
    xp: 50,
    conteudo:
      "Apoiar alguém neurodivergente — ou a si mesmo — exige conhecimento, paciência e criatividade. As estratégias mais eficazes são individualizadas: o que funciona para um autista pode não funcionar para outro.\n\nPara pessoas neurodivergentes:\n• Identifique seus gatilhos de sobrecarga e planeje formas de gerenciá-los\n• Construa rotinas consistentes — elas reduzem a carga cognitiva\n• Use tecnologias assistivas: aplicativos de foco, lembretes, text-to-speech\n• Encontre comunidades de pessoas parecidas — o sentimento de pertencimento é poderoso\n\nPara familiares e educadores:\n• Informe-se sobre as condições específicas antes de tirar conclusões\n• Foque nas forças, não apenas nos desafios\n• Comemore pequenas vitórias — elas constroem autoestima\n• Busque apoio profissional quando necessário: psicólogos, fonoaudiólogos, TOs",
    curiosidade:
      "O conceito de 'dupla excepcionalidade' (twice exceptional ou 2e) descreve pessoas que são ao mesmo tempo superdotadas e neurodivergentes — uma combinação mais comum do que se imagina, especialmente em autistas e ADHDers.",
    exemploPratico:
      "Uma família que cria um 'canto tranquilo' em casa — um espaço silencioso, com iluminação suave e poucas distrações — para seu filho autista dar regulação sensorial reduz crises e melhora a qualidade de vida de todos.",
    dica: "Autocuidado não é egoísmo — é estratégia. Quem apoia pessoas neurodivergentes sem cuidar de si mesmo esgota e perde a capacidade de ajudar. Cuide-se para poder cuidar.",
  },
];

/* ─────────────────────────────────────────────────────────────────
   MINI-JOGOS DA PÁGINA DE DESAFIOS
   `answer` é a resposta correta (comparada em minúsculas e sem espaços).
   `reward` é a quantidade de moedas/progresso ganhos ao acertar.
───────────────────────────────────────────────────────────────── */
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
