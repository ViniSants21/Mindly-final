-- =====================================================================
--  MINDLY — Recriar tabela challenge_questions com gabarito
--  Cole TODO o conteúdo no SQL Editor do Supabase e clique em RUN.
-- =====================================================================

-- =====================================================================
--  1. APAGAR A TABELA ANTIGA
-- =====================================================================
DROP TABLE IF EXISTS public.challenge_questions CASCADE;

-- =====================================================================
--  2. CRIAR A TABELA COM A ESTRUTURA CORRETA
-- =====================================================================
CREATE TABLE public.challenge_questions (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id   uuid        NOT NULL REFERENCES public.challenges(id) ON DELETE CASCADE,
  question       text        NOT NULL,
  option_a       text        NOT NULL,
  option_b       text        NOT NULL,
  option_c       text        NOT NULL,
  option_d       text        NOT NULL,
  correct_answer text        NOT NULL CHECK (correct_answer IN ('a','b','c','d')),
  created_at     timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_challenge_questions_challenge
  ON public.challenge_questions(challenge_id);

-- =====================================================================
--  3. RLS — todos leem, apenas admin escreve
-- =====================================================================
ALTER TABLE public.challenge_questions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "challenge_questions_read_all"    ON public.challenge_questions;
DROP POLICY IF EXISTS "challenge_questions_admin_write" ON public.challenge_questions;

CREATE POLICY "challenge_questions_read_all" ON public.challenge_questions
  FOR SELECT USING (true);

CREATE POLICY "challenge_questions_admin_write" ON public.challenge_questions
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- =====================================================================
--  4. PERGUNTAS POR DESAFIO
--  Cada bloco usa o TÍTULO do desafio para achar o ID correto.
--  Se o desafio não existir no seu banco, o INSERT é simplesmente ignorado.
-- =====================================================================

-- ---- MATEMÁTICA -----------------------------------------------------
INSERT INTO public.challenge_questions
  (challenge_id, question, option_a, option_b, option_c, option_d, correct_answer)
SELECT c.id, q.question, q.a, q.b, q.c, q.d, q.correta
FROM public.challenges c
CROSS JOIN (VALUES
  ('Quanto é 15 × 4?',
   '45', '60', '50', '75', 'b'),
  ('Qual é a raiz quadrada de 144?',
   '10', '14', '12', '16', 'c'),
  ('Quanto é 25% de 200?',
   '25', '75', '100', '50', 'd'),
  ('Quantos lados tem um hexágono?',
   '5', '7', '8', '6', 'd'),
  ('Qual é o resultado de 2³?',
   '6', '8', '9', '4', 'b'),
  ('Quanto é (3 + 7) × 5?',
   '40', '60', '50', '35', 'c'),
  ('Qual número primo vem depois do 11?',
   '12', '14', '13', '15', 'c')
) AS q(question, a, b, c, d, correta)
WHERE c.title = 'Matemática';

-- ---- LEITURA DINÂMICA -----------------------------------------------
INSERT INTO public.challenge_questions
  (challenge_id, question, option_a, option_b, option_c, option_d, correct_answer)
SELECT c.id, q.question, q.a, q.b, q.c, q.d, q.correta
FROM public.challenges c
CROSS JOIN (VALUES
  ('Ler apenas as palavras-chave para ter uma ideia geral do texto é chamado de?',
   'Leitura analítica', 'Skimming', 'Varredura', 'Leitura intensiva', 'b'),
  ('Buscar uma informação específica num texto sem ler tudo é chamado de?',
   'Escaneamento', 'Leitura criativa', 'Leitura em voz alta', 'Leitura profunda', 'a'),
  ('Reescrever a ideia principal de um texto com as próprias palavras é fazer uma?',
   'Cópia', 'Paráfrase', 'Citação', 'Tradução', 'b'),
  ('Marcar trechos importantes durante a leitura é uma técnica de?',
   'Skimming', 'Memorização', 'Anotação ativa', 'Leitura dinâmica', 'c'),
  ('Quantas palavras por minuto lê, em média, um adulto?',
   '100', '400', '250', '500', 'c'),
  ('Organizar as principais ideias de um texto em tópicos é criar um?',
   'Resumo', 'Índice', 'Glossário', 'Paráfrase', 'a')
) AS q(question, a, b, c, d, correta)
WHERE c.title = 'Leitura Dinâmica';

-- ---- CONCENTRAÇÃO TOTAL ---------------------------------------------
INSERT INTO public.challenge_questions
  (challenge_id, question, option_a, option_b, option_c, option_d, correct_answer)
SELECT c.id, q.question, q.a, q.b, q.c, q.d, q.correta
FROM public.challenges c
CROSS JOIN (VALUES
  ('A Técnica Pomodoro usa blocos de trabalho de quantos minutos?',
   '15 minutos', '45 minutos', '30 minutos', '25 minutos', 'd'),
  ('O estado de foco máximo e fluxo total é chamado de?',
   'Meditação', 'Flow', 'Hiperfoco', 'Mindfulness', 'b'),
  ('O que mais prejudica a concentração durante o estudo?',
   'Música suave', 'Luz natural', 'Notificações do celular', 'Pausas curtas', 'c'),
  ('Focar em apenas uma tarefa de cada vez é chamado de?',
   'Multitarefa', 'Priorização', 'Monotarefa', 'Sequenciamento', 'c'),
  ('Qual técnica divide o estudo em blocos com pausas regulares?',
   'Método Cornell', 'Técnica Pomodoro', 'Leitura ativa', 'Mapa mental', 'b'),
  ('Eliminar distrações antes de estudar é um exemplo de gestão do quê?',
   'Tempo', 'Ambiente', 'Recursos', 'Humor', 'b')
) AS q(question, a, b, c, d, correta)
WHERE c.title = 'Concentração total';

-- ---- REVISÃO SEMANAL ------------------------------------------------
INSERT INTO public.challenge_questions
  (challenge_id, question, option_a, option_b, option_c, option_d, correct_answer)
SELECT c.id, q.question, q.a, q.b, q.c, q.d, q.correta
FROM public.challenges c
CROSS JOIN (VALUES
  ('Rever conteúdo em intervalos crescentes (1 dia, 3 dias, 1 semana) é?',
   'Revisão intensiva', 'Estudo fracionado', 'Repetição espaçada', 'Memorização forçada', 'c'),
  ('Explicar o conteúdo como se fosse ensinar outra pessoa é a Técnica de?',
   'Cornell', 'Feynman', 'Pomodoro', 'Loci', 'b'),
  ('Cartões com pergunta na frente e resposta atrás são chamados de?',
   'Mapas mentais', 'Fichas de resumo', 'Flashcards', 'Esquemas', 'c'),
  ('Qual técnica divide a página em coluna de perguntas e coluna de respostas?',
   'Método Feynman', 'Mapa mental', 'Método Cornell', 'Skimming', 'c'),
  ('Revisar o conteúdo logo após aprender, antes de esquecer, é revisão?',
   'Espaçada', 'Imediata', 'Profunda', 'Ativa', 'b'),
  ('Resumir o conteúdo usando setas e conexões visuais é criar um mapa?',
   'Cronológico', 'Conceitual', 'Mental', 'Temático', 'c')
) AS q(question, a, b, c, d, correta)
WHERE c.title = 'Revisão semanal';

-- ---- QUÍMICA --------------------------------------------------------
INSERT INTO public.challenge_questions
  (challenge_id, question, option_a, option_b, option_c, option_d, correct_answer)
SELECT c.id, q.question, q.a, q.b, q.c, q.d, q.correta
FROM public.challenges c
CROSS JOIN (VALUES
  ('Qual é o símbolo químico do ouro?',
   'Go', 'Or', 'Ou', 'Au', 'd'),
  ('Qual é o número atômico do carbono (C)?',
   '4', '6', '8', '12', 'b'),
  ('H₂O é a fórmula química de qual substância?',
   'Água oxigenada', 'Sal', 'Água', 'Ácido clorídrico', 'c'),
  ('Uma solução com pH menor que 7 é classificada como?',
   'Neutra', 'Básica', 'Alcalina', 'Ácida', 'd'),
  ('O tipo de ligação química que compartilha elétrons entre átomos é a ligação?',
   'Iônica', 'Metálica', 'Covalente', 'Van der Waals', 'c'),
  ('Qual é o símbolo químico do ferro?',
   'Fr', 'Fo', 'Fe', 'Fi', 'c'),
  ('A tabela que organiza todos os elementos químicos é chamada de Tabela?',
   'Química', 'Atômica', 'Periódica', 'Molecular', 'c')
) AS q(question, a, b, c, d, correta)
WHERE c.title = 'Química';

-- ---- REDAÇÃO --------------------------------------------------------
INSERT INTO public.challenge_questions
  (challenge_id, question, option_a, option_b, option_c, option_d, correct_answer)
SELECT c.id, q.question, q.a, q.b, q.c, q.d, q.correta
FROM public.challenges c
CROSS JOIN (VALUES
  ('O texto que defende uma ideia e busca convencer o leitor é o texto?',
   'Narrativo', 'Descritivo', 'Argumentativo', 'Informativo', 'c'),
  ('A parte inicial do texto, onde o tema é apresentado, é chamada de?',
   'Desenvolvimento', 'Conclusão', 'Tese', 'Introdução', 'd'),
  ('Palavras como "portanto", "além disso" e "entretanto" são chamadas de?',
   'Adjetivos', 'Conectivos', 'Substantivos', 'Advérbios', 'b'),
  ('A ideia central que será defendida ao longo do texto argumentativo é a?',
   'Conclusão', 'Paráfrase', 'Tese', 'Narrativa', 'c'),
  ('O encerramento do texto, onde o argumento é retomado e concluído, é a?',
   'Introdução', 'Tese', 'Desenvolvimento', 'Conclusão', 'd'),
  ('Um bloco de texto que desenvolve uma ideia específica é chamado de?',
   'Frase', 'Parágrafo', 'Capítulo', 'Seção', 'b')
) AS q(question, a, b, c, d, correta)
WHERE c.title = 'Redação';

-- ---- GESTÃO DO TEMPO ------------------------------------------------
INSERT INTO public.challenge_questions
  (challenge_id, question, option_a, option_b, option_c, option_d, correct_answer)
SELECT c.id, q.question, q.a, q.b, q.c, q.d, q.correta
FROM public.challenges c
CROSS JOIN (VALUES
  ('A Técnica Pomodoro usa blocos de trabalho focado de quantos minutos?',
   '30 minutos', '15 minutos', '45 minutos', '25 minutos', 'd'),
  ('Organizar tarefas por urgência e importância é usar a Matriz de?',
   'Pareto', 'Maslow', 'Eisenhower', 'SWOT', 'c'),
  ('Passar uma tarefa para outra pessoa realizar é chamado de?',
   'Priorização', 'Terceirização', 'Planejamento', 'Delegação', 'd'),
  ('Fazer a tarefa mais difícil primeiro, logo pela manhã, é "comer o"?',
   'Elefante', 'Sapo', 'Leão', 'Urso', 'b'),
  ('O princípio de que 20% das causas geram 80% dos resultados é a Lei de?',
   'Murphy', 'Newton', 'Pareto', 'Moore', 'c'),
  ('Reservar tempo na agenda para imprevistos é criar um?',
   'Prazo', 'Buffer', 'Checkpoint', 'Sprint', 'b')
) AS q(question, a, b, c, d, correta)
WHERE c.title = 'Gestão do Tempo';

-- ---- COMUNICAÇÃO ----------------------------------------------------
INSERT INTO public.challenge_questions
  (challenge_id, question, option_a, option_b, option_c, option_d, correct_answer)
SELECT c.id, q.question, q.a, q.b, q.c, q.d, q.correta
FROM public.challenges c
CROSS JOIN (VALUES
  ('Ouvir com atenção total, sem interromper e com empatia, é chamado de escuta?',
   'Passiva', 'Ativa', 'Reflexiva', 'Empática', 'b'),
  ('Expressar-se de forma clara e respeitosa, sem agressividade, é comunicação?',
   'Passiva', 'Agressiva', 'Assertiva', 'Passivo-agressiva', 'c'),
  ('Gestos, postura corporal e expressões faciais fazem parte da comunicação?',
   'Verbal', 'Escrita', 'Digital', 'Não-verbal', 'd'),
  ('Dar retorno a alguém sobre seu desempenho ou comportamento é fornecer?',
   'Avaliação', 'Crítica', 'Feedback', 'Conselho', 'c'),
  ('Tom de voz, velocidade da fala e pausas fazem parte da comunicação?',
   'Kinésica', 'Paraverbal', 'Digital', 'Escrita', 'b'),
  ('Confirmar com o outro que a mensagem foi entendida corretamente é?',
   'Repetição', 'Eco', 'Validação', 'Réplica', 'c')
) AS q(question, a, b, c, d, correta)
WHERE c.title = 'Comunicação';

-- ---- LIDERANÇA ------------------------------------------------------
INSERT INTO public.challenge_questions
  (challenge_id, question, option_a, option_b, option_c, option_d, correct_answer)
SELECT c.id, q.question, q.a, q.b, q.c, q.d, q.correta
FROM public.challenges c
CROSS JOIN (VALUES
  ('O líder que toma todas as decisões sozinho utiliza o estilo de liderança?',
   'Democrático', 'Liberal', 'Autoritário', 'Situacional', 'c'),
  ('O líder que envolve a equipe nas decisões utiliza o estilo de liderança?',
   'Autocrático', 'Laissez-faire', 'Situacional', 'Democrático', 'd'),
  ('Inspirar e motivar a equipe com uma visão de futuro é liderança?',
   'Transacional', 'Transformacional', 'Situacional', 'Autoritária', 'b'),
  ('Adaptar o estilo de liderança conforme a maturidade da equipe é liderança?',
   'Democrática', 'Transformacional', 'Situacional', 'Liberal', 'c'),
  ('Empoderar a equipe para tomar decisões de forma autônoma é chamado de?',
   'Delegação', 'Controle', 'Supervisão', 'Empoderamento', 'd'),
  ('Mediar conflitos entre membros da equipe é uma habilidade de?',
   'Comunicação', 'Delegação', 'Liderança', 'Gestão de conflitos', 'd')
) AS q(question, a, b, c, d, correta)
WHERE c.title = 'Liderança';

-- ---- INTELIGÊNCIA EMOCIONAL -----------------------------------------
INSERT INTO public.challenge_questions
  (challenge_id, question, option_a, option_b, option_c, option_d, correct_answer)
SELECT c.id, q.question, q.a, q.b, q.c, q.d, q.correta
FROM public.challenges c
CROSS JOIN (VALUES
  ('A capacidade de se colocar no lugar do outro e sentir o que ele sente é?',
   'Simpatia', 'Empatia', 'Respeito', 'Tolerância', 'b'),
  ('Controlar impulsos e não agir no calor do momento é chamado de?',
   'Repressão', 'Indiferença', 'Autocontrole', 'Frieza', 'c'),
  ('Reconhecer e nomear as próprias emoções é uma habilidade de?',
   'Autocrítica', 'Introspecção', 'Autoconsciência', 'Meditação', 'c'),
  ('A motivação que vem do prazer interno pela tarefa, sem recompensa externa, é?',
   'Extrínseca', 'Condicional', 'Financeira', 'Intrínseca', 'd'),
  ('O conceito de Inteligência Emocional foi popularizado pelo psicólogo Daniel?',
   'Kahneman', 'Bandura', 'Goleman', 'Maslow', 'c'),
  ('A habilidade de entender as emoções dos outros e responder adequadamente é?',
   'Assertividade', 'Empatia', 'Autocontrole', 'Automotivação', 'b')
) AS q(question, a, b, c, d, correta)
WHERE c.title = 'Inteligência Emocional';

-- ---- PRODUTIVIDADE --------------------------------------------------
INSERT INTO public.challenge_questions
  (challenge_id, question, option_a, option_b, option_c, option_d, correct_answer)
SELECT c.id, q.question, q.a, q.b, q.c, q.d, q.correta
FROM public.challenges c
CROSS JOIN (VALUES
  ('20% das ações geram 80% dos resultados. Isso é o Princípio de?',
   'Pareto', 'Newton', 'Moore', 'Murphy', 'a'),
  ('Realizar várias tarefas ao mesmo tempo é chamado de?',
   'Hiperatividade', 'Multitarefa', 'Polifasia', 'Sequenciamento', 'b'),
  ('GTD (Getting Things Done) é um método de?',
   'Comunicação', 'Liderança', 'Produtividade', 'Memorização', 'c'),
  ('Dividir uma grande tarefa em partes menores e gerenciáveis é?',
   'Priorização', 'Delegação', 'Fragmentação', 'Planejamento', 'c'),
  ('Alcançar o objetivo proposto com o mínimo de desperdício é trabalhar com?',
   'Eficácia', 'Esforço', 'Eficiência', 'Dedicação', 'c'),
  ('Fazer a coisa certa (objetivo correto) independente do esforço é?',
   'Eficiência', 'Eficácia', 'Produção', 'Execução', 'b')
) AS q(question, a, b, c, d, correta)
WHERE c.title = 'Produtividade';

-- ---- AUTOCONHECIMENTO -----------------------------------------------
INSERT INTO public.challenge_questions
  (challenge_id, question, option_a, option_b, option_c, option_d, correct_answer)
SELECT c.id, q.question, q.a, q.b, q.c, q.d, q.correta
FROM public.challenges c
CROSS JOIN (VALUES
  ('Entender seus próprios pontos fortes e fracos é praticar?',
   'Autocontrole', 'Autoconhecimento', 'Autocrítica', 'Autossabotagem', 'b'),
  ('A ferramenta que mapeia Forças, Fraquezas, Oportunidades e Ameaças é a?',
   'Matriz de Eisenhower', 'Análise SWOT', 'Diagrama de Pareto', 'Mapa Mental', 'b'),
  ('Questionar crenças limitantes sobre si mesmo é um exercício de?',
   'Autoestima', 'Autossabotagem', 'Autoconhecimento', 'Automotivação', 'c'),
  ('Observar seus padrões de comportamento e emoções é desenvolver?',
   'Introspecção', 'Empatia', 'Assertividade', 'Comunicação', 'a'),
  ('Definir valores pessoais claros ajuda principalmente na?',
   'Comunicação', 'Tomada de decisão', 'Memorização', 'Produtividade', 'b')
) AS q(question, a, b, c, d, correta)
WHERE c.title = 'Autoconhecimento';

-- ---- MINDFULNESS / BEM-ESTAR ----------------------------------------
INSERT INTO public.challenge_questions
  (challenge_id, question, option_a, option_b, option_c, option_d, correct_answer)
SELECT c.id, q.question, q.a, q.b, q.c, q.d, q.correta
FROM public.challenges c
CROSS JOIN (VALUES
  ('Praticar atenção plena no momento presente é chamado de?',
   'Yoga', 'Meditação', 'Mindfulness', 'Relaxamento', 'c'),
  ('Esgotamento físico e emocional causado por excesso de trabalho é chamado de?',
   'Cansaço', 'Burnout', 'Estresse', 'Ansiedade', 'b'),
  ('A técnica de respiração profunda para acalmar o sistema nervoso é?',
   'Respiração diafragmática', 'Respiração oral', 'Apneia', 'Hiperventilação', 'a'),
  ('Dormir bem regularmente é fundamental para?',
   'Apenas o corpo', 'Saúde física e mental', 'Apenas a memória', 'A aparência', 'b'),
  ('Praticar gratidão diariamente está associado a aumento de?',
   'Produtividade', 'Bem-estar e felicidade', 'Memória', 'Inteligência', 'b')
) AS q(question, a, b, c, d, correta)
WHERE c.title IN ('Mindfulness', 'Bem-estar', 'Saúde Mental');

-- =====================================================================
--  5. VERIFICAÇÃO FINAL — veja o resultado após executar
-- =====================================================================
SELECT
  c.title                       AS desafio,
  COUNT(cq.id)                  AS total_perguntas
FROM public.challenges c
LEFT JOIN public.challenge_questions cq ON cq.challenge_id = c.id
GROUP BY c.title
ORDER BY c.title;
