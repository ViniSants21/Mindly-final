-- ==========================================================================
-- MINDLY — Migração Completa da Trilha de Aprendizagem
-- Execute no Supabase SQL Editor.
-- COMPATIBILIDADE TOTAL com learning_progress.step_id (integer).
-- ==========================================================================

-- --------------------------------------------------------------------------
-- 0. Remover tabela anterior se existia como UUID (sem dados de usuário)
-- --------------------------------------------------------------------------
DROP TABLE IF EXISTS public.learning_modules CASCADE;

-- --------------------------------------------------------------------------
-- 1. Criar learning_modules com INTEGER pk compatível com learning_progress
-- --------------------------------------------------------------------------
CREATE TABLE public.learning_modules (
  id              integer     PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  titulo          text        NOT NULL,
  icon            text        NOT NULL DEFAULT 'brain',
  nivel           text        NOT NULL DEFAULT 'Fácil'
                              CHECK (nivel IN ('Fácil', 'Médio', 'Avançado')),
  tempo           text        NOT NULL DEFAULT '30 min',
  xp              integer     NOT NULL DEFAULT 50 CHECK (xp >= 0),
  conteudo        text        NOT NULL DEFAULT '',
  curiosidade     text,
  exemplo_pratico text,
  dica            text,
  status          text        NOT NULL DEFAULT 'Ativo'
                              CHECK (status IN ('Ativo', 'Inativo')),
  position        integer     NOT NULL DEFAULT 0,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_learning_modules_position
  ON public.learning_modules (position);

CREATE INDEX IF NOT EXISTS idx_learning_modules_status
  ON public.learning_modules (status);

-- Trigger updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_learning_modules_updated_at ON public.learning_modules;
CREATE TRIGGER trg_learning_modules_updated_at
  BEFORE UPDATE ON public.learning_modules
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- --------------------------------------------------------------------------
-- 2. Seed dos 12 módulos existentes com IDs explícitos (1-12)
--    OVERRIDING SYSTEM VALUE permite inserir IDs manuais em colunas IDENTITY.
--    IDs 1-12 são compatíveis com registros existentes em learning_progress.
-- --------------------------------------------------------------------------

INSERT INTO public.learning_modules
  (id, titulo, icon, nivel, tempo, xp, conteudo, curiosidade, exemplo_pratico, dica, status, position)
OVERRIDING SYSTEM VALUE
VALUES
(1,
 'Introdução à Neurodiversidade',
 'brain', 'Fácil', '5 min', 20,
 'Neurodiversidade é o conceito que reconhece e celebra as variações naturais no funcionamento do cérebro humano. O termo foi criado pela socióloga australiana Judy Singer, em 1998, para descrever diferenças neurológicas como o autismo, TDAH, dislexia e outras condições como variações normais — não como defeitos.

Essas diferenças influenciam como as pessoas pensam, aprendem, se comunicam e percebem o mundo. Cada cérebro é único e traz suas próprias forças e desafios. Compreender a neurodiversidade é o primeiro passo para construir uma sociedade mais inclusiva, empática e justa.',
 'Estima-se que 15% a 20% da população mundial seja neurodivergente — isso significa que 1 em cada 5 pessoas tem um funcionamento neurológico diferente do considerado padrão.',
 'Um estudante autista pode ter dificuldade com interações sociais em grupo, mas ser extraordinariamente detalhista e focado em tarefas que envolvem padrões e lógica.',
 'Não existe um jeito certo de aprender — existe o seu jeito. Conhecer seu perfil cognitivo é a base de todo aprendizado eficaz.',
 'Ativo', 1),

(2,
 'Como o Cérebro Aprende',
 'lightning', 'Fácil', '7 min', 25,
 'O aprendizado acontece quando o cérebro forma e fortalece conexões entre neurônios — um processo chamado neuroplasticidade. Cada nova informação cria um caminho neural, e a repetição torna esse caminho mais forte e rápido.

Algumas pessoas aprendem melhor de forma visual (imagens, gráficos), outras de forma auditiva (explicações, podcasts) e outras de forma cinestésica (fazendo, tocando, experimentando). Emoção, contexto e relevância pessoal aumentam muito a retenção — o cérebro prioriza informações que parecem importantes para sobrevivência ou felicidade.',
 'O sono é fundamental para consolidar o aprendizado: durante o sono profundo, o cérebro transfere informações da memória de curto prazo para a memória de longo prazo.',
 'Estudar matemática com exemplos do cotidiano (como calcular o troco ou dividir a conta) ativa mais áreas do cérebro do que decorar fórmulas abstratas, aumentando a retenção.',
 'Teste diferentes métodos e observe o que funciona melhor para você. Combinar visual + cinestésico costuma ser especialmente eficaz para quem tem TDAH ou dislexia.',
 'Ativo', 2),

(3,
 'TEA — Transtorno do Espectro Autista',
 'star', 'Médio', '10 min', 30,
 'O Transtorno do Espectro Autista (TEA) é uma condição neurológica que afeta a forma como uma pessoa percebe e interage com o mundo. O termo "espectro" reflete a enorme diversidade de perfis — não há dois autistas iguais.

Algumas características comuns incluem: diferenças na comunicação social, preferência por rotinas, sensibilidades sensoriais (sons, texturas, luzes) e interesses muito intensos em áreas específicas. Muitas pessoas autistas têm habilidades extraordinárias em memória, lógica, música, matemática ou arte.

O diagnóstico precoce e o suporte adequado fazem uma diferença enorme no desenvolvimento e na qualidade de vida.',
 'O físico Alan Turing, pioneiro da computação moderna, e Nikola Tesla, inventor e engenheiro genial, são frequentemente citados como possíveis exemplos históricos de pessoas no espectro autista.',
 'Em vez de fazer uma entrevista de emprego convencional, algumas empresas criaram processos seletivos adaptados para candidatos autistas — com tarefas práticas no lugar de perguntas sociais — e descobriram talentos excepcionais.',
 'Ao se comunicar com pessoas autistas, prefira linguagem direta e objetiva. Evite sarcasmo e metáforas ambíguas, pois podem ser interpretados literalmente.',
 'Ativo', 3),

(4,
 'TDAH — Desafios e Potenciais',
 'flame', 'Médio', '10 min', 30,
 'O Transtorno do Déficit de Atenção com Hiperatividade (TDAH) é caracterizado por dificuldades persistentes de atenção, impulsividade e, em alguns casos, hiperatividade. No entanto, o TDAH também traz forças únicas: criatividade elevada, capacidade de hiperfoco em atividades de interesse, energia e pensamento não-linear.

Existem três tipos principais: predominantemente desatento, predominantemente hiperativo-impulsivo, e combinado. O TDAH afeta cerca de 5% a 8% das crianças e 2% a 5% dos adultos no mundo.

Com as estratégias certas — organização, pausas regulares, ambientes adequados e, quando necessário, tratamento medicamentoso — pessoas com TDAH podem ser altamente bem-sucedidas.',
 'O empresário Richard Branson (Virgin), o nadador Michael Phelps e a chef Jamie Oliver têm TDAH diagnosticado. Todos atribuem parte de seu sucesso à criatividade e energia que o TDAH trouxe às suas vidas.',
 'A Técnica Pomodoro (25 minutos de foco + 5 de pausa) foi desenvolvida para lidar com dificuldades de atenção e é especialmente eficaz para estudantes com TDAH.',
 'Para pessoas com TDAH, dividir tarefas em pequenos passos com recompensas intermediárias ativa o sistema de dopamina e aumenta muito a produtividade.',
 'Ativo', 4),

(5,
 'Dislexia e o Dom da Leitura',
 'book', 'Médio', '8 min', 25,
 'A dislexia é uma diferença neurológica que afeta a capacidade de ler e processar linguagem escrita. Pessoas com dislexia podem trocar letras, ler devagar ou ter dificuldade para decodificar palavras — mas isso não tem relação com inteligência. A maioria possui QI normal ou acima da média.

A dislexia é uma das condições mais comuns do espectro da neurodiversidade, afetando entre 5% e 15% da população. Com suporte adequado — como uso de fontes especiais, audiobooks e mais tempo em avaliações — estudantes com dislexia prosperam.

Muitas pessoas disléxicas desenvolvem habilidades extraordinárias de pensamento visual, resolução de problemas e visão do "todo".',
 'Albert Einstein, Leonardo da Vinci, Walt Disney e a escritora Agatha Christie são exemplos históricos de pessoas com dislexia que deixaram legados monumentais.',
 'A fonte "OpenDyslexic", criada especialmente para pessoas com dislexia, modifica o peso das letras para tornar a leitura mais fácil. Muitos e-readers e aplicativos educacionais já a oferecem.',
 'Audiobooks e text-to-speech são ferramentas poderosas para estudantes com dislexia. Ouvir o conteúdo enquanto acompanha o texto acelera a aprendizagem.',
 'Ativo', 5),

(6,
 'Discalculia — Além dos Números',
 'math', 'Médio', '8 min', 25,
 'A discalculia é uma diferença neurológica que afeta a capacidade de compreender e trabalhar com números e conceitos matemáticos. Pessoas com discalculia podem ter dificuldade para lembrar sequências de números, entender conceitos de quantidade, medir tempo ou executar operações básicas.

Assim como a dislexia, a discalculia não indica falta de inteligência — é apenas uma forma diferente de processar informações matemáticas. Afeta cerca de 3% a 6% da população.

Estratégias eficazes incluem o uso de objetos concretos para representar números, calculadoras, tabelas visuais e muito contexto prático nas aprendizagens.',
 'Pesquisas indicam que pessoas com discalculia frequentemente compensam com outras habilidades elevadas, como linguagem verbal, criatividade e inteligência emocional.',
 'Em vez de decorar a tabuada de forma abstrata, crianças com discalculia aprendem muito mais usando blocos, dedos, fichas ou aplicativos que tornam os números visíveis e tangíveis.',
 'Se você tem dificuldade com números, use calculadoras sem culpa — são ferramentas, não muletas. O importante é compreender o conceito, não o cálculo em si.',
 'Ativo', 6),

(7,
 'Inclusão e Acessibilidade',
 'award', 'Médio', '10 min', 30,
 'Inclusão vai além de permitir que pessoas com diferenças neurológicas participem de um ambiente — significa adaptar o ambiente para que todos possam participar plenamente. Acessibilidade é o conjunto de recursos, adaptações e práticas que tornam isso possível.

No contexto educacional, isso inclui: tempo extra em provas, salas com menor estimulação sensorial, materiais em formatos variados (visual, auditivo, tátil), tecnologias assistivas e professores capacitados.

No Brasil, a Lei Brasileira de Inclusão (LBI, 2015) e a Política Nacional de Educação Especial garantem esses direitos. Conhecer seus direitos é o primeiro passo para exigi-los.',
 'Países como Dinamarca, Holanda e Canadá lideram mundialmente em práticas de educação inclusiva, com resultados acadêmicos superiores para todos os alunos — não apenas os neurodivergentes.',
 'Uma escola que oferece fones de ouvido para alunos com hipersensibilidade sonora, permite sentar longe de janelas para alunos com TDAH e usa letras maiores para disléxicos não está fazendo favor — está cumprindo com direitos fundamentais.',
 'Se você é neurodivergente, pesquise sobre a Lei Brasileira de Inclusão (Lei 13.146/2015) e saiba quais adaptações você tem direito a exigir em escolas e concursos.',
 'Ativo', 7),

(8,
 'Comunicação Inclusiva',
 'lightbulb', 'Fácil', '7 min', 20,
 'Comunicação inclusiva é a prática de adaptar a forma como nos expressamos para garantir que todos possam entender e participar. Isso é especialmente importante ao interagir com pessoas neurodivergentes, que podem processar informações de formas diferentes.

Princípios básicos: use linguagem simples e direta; evite sarcasmo e ironia quando não estiver claro; dê tempo para a pessoa processar e responder; prefira comunicação escrita quando necessário; pergunte sobre preferências de comunicação em vez de assumir.

Comunicação aumentativa e alternativa (CAA) inclui pranchas de comunicação, aplicativos e símbolos visuais que ajudam pessoas com dificuldades de fala a se expressar.',
 'O aplicativo Proloquo2Go, usado por pessoas autistas não-verbais, já ajudou milhares de pessoas a se comunicarem pela primeira vez na vida com seus familiares.',
 'Em vez de dizer "Está tudo bem?" (pergunta vaga), diga "Você está com dor? Está com fome? Está com medo?" — perguntas específicas facilitam muito a comunicação com pessoas autistas.',
 'Ao falar com alguém neurodivergente, aguarde 5 a 10 segundos após fazer uma pergunta antes de reformulá-la. Muitos precisam desse tempo extra para processar.',
 'Ativo', 8),

(9,
 'Empatia e Respeito às Diferenças',
 'trophy', 'Fácil', '7 min', 20,
 'Empatia é a capacidade de reconhecer e compreender as emoções e perspectivas dos outros. No contexto da neurodiversidade, ela exige um passo extra: tentar entender como o mundo parece para alguém cujo cérebro funciona de forma diferente do nosso.

Respeito às diferenças começa com educação — aprender sobre as condições que outros carregam, abandonar estereótipos e resistir ao impulso de comparar comportamentos com o "padrão". Cada pessoa tem uma história, um conjunto de desafios e forças únicas.

Ambientes empáticos — em casa, na escola e no trabalho — reduzem a ansiedade de pessoas neurodivergentes e permitem que elas sejam quem realmente são, sem se mascarar.',
 'O "mascaramento" (masking) é o processo pelo qual pessoas neurodivergentes — especialmente autistas — disfarçam suas características para se encaixar socialmente. Isso é extremamente desgastante e aumenta o risco de burnout e depressão.',
 'Quando uma criança autista tem uma "crise" no supermercado por causa de sons altos, ela não está "fazendo birra" — está sofrendo com sobrecarga sensorial. A empatia começa por entender isso.',
 'Antes de reagir ao comportamento de alguém, pergunte-se: "Qual dificuldade essa pessoa pode estar enfrentando que eu não consigo ver?" Essa pausa muda tudo.',
 'Ativo', 9),

(10,
 'Mitos e Verdades sobre Neurodiversidade',
 'target', 'Médio', '10 min', 30,
 'Existem muitos mitos sobre neurodiversidade que prejudicam pessoas neurodivergentes, atrasam diagnósticos e dificultam a inclusão. Vamos desmistificar os mais comuns:

❌ MITO: Autismo é causado por vacinas. ✅ VERDADE: Estudos com milhões de crianças nunca encontraram essa relação. O mito surgiu de um artigo científico falso publicado em 1998 e retratado pela revista.

❌ MITO: TDAH é desculpa para preguiça. ✅ VERDADE: TDAH envolve diferenças reais no funcionamento do córtex pré-frontal e nos sistemas de dopamina e noradrenalina.

❌ MITO: Pessoas autistas não têm empatia. ✅ VERDADE: Muitas têm empatia intensa — apenas expressam e processam diferente.

❌ MITO: Dislexia significa ver letras invertidas. ✅ VERDADE: É uma dificuldade fonológica — o problema está no processamento dos sons da linguagem, não na visão.',
 'A Organização Mundial da Saúde (OMS) removeu o autismo da lista de "doenças" em 2022, classificando-o como uma condição do neurodesenvolvimento — um passo importante para combater o estigma.',
 'Um professor que entende que um aluno com TDAH esquece o dever de casa por dificuldade de memória de trabalho — não por preguiça — vai usar cadernos de recado, alertas e sistemas de checklist em vez de punições.',
 'Quando ouvir um mito sobre neurodiversidade, resista à tentação de ignorar. Um comentário educativo gentil pode mudar perspectivas e ajudar alguém que está sendo prejudicado por desinformação.',
 'Ativo', 10),

(11,
 'Neurodiversidade no Mercado de Trabalho',
 'trending', 'Avançado', '12 min', 40,
 'O mercado de trabalho está gradualmente reconhecendo o valor da neurodiversidade. Empresas como SAP, Microsoft, JP Morgan e EY têm programas específicos de contratação de profissionais neurodivergentes, descobrindo que eles trazem perspectivas únicas, atenção a detalhes, criatividade e comprometimento excepcionais.

Desafios comuns incluem: processos seletivos com dinâmicas sociais que desfavorecem autistas e introvertidos; ambientes open space barulhentos que prejudicam quem tem TDAH ou hipersensibilidade; falta de flexibilidade de horários e formatos de trabalho.

Adaptações simples — como trabalho remoto, comunicação principalmente por escrito, fones de ouvido, instruções claras e mentorias individuais — podem ser a diferença entre um colaborador mediano e um colaborador excepcional.',
 'A SAP, gigante de tecnologia, tem uma iniciativa chamada "Autism at Work" e descobriu que colaboradores autistas em áreas de teste de software encontravam bugs que os demais testadores humanos e ferramentas automatizadas não detectavam.',
 'Um profissional com TDAH pode ser um vendedor extraordinário graças à energia e criatividade, mas ter dificuldade com relatórios e prazos. Uma solução simples: um assistente para a parte burocrática libera seu potencial principal.',
 'Se você é neurodivergente e está buscando emprego, pesquise empresas com programas de diversidade cognitiva. Muitas consideram isso um diferencial — não uma desvantagem.',
 'Ativo', 11),

(12,
 'Estratégias de Apoio e Autocuidado',
 'medal', 'Avançado', '15 min', 50,
 'Apoiar alguém neurodivergente — ou a si mesmo — exige conhecimento, paciência e criatividade. As estratégias mais eficazes são individualizadas: o que funciona para um autista pode não funcionar para outro.

Para pessoas neurodivergentes:
• Identifique seus gatilhos de sobrecarga e planeje formas de gerenciá-los
• Construa rotinas consistentes — elas reduzem a carga cognitiva
• Use tecnologias assistivas: aplicativos de foco, lembretes, text-to-speech
• Encontre comunidades de pessoas parecidas — o sentimento de pertencimento é poderoso

Para familiares e educadores:
• Informe-se sobre as condições específicas antes de tirar conclusões
• Foque nas forças, não apenas nos desafios
• Comemore pequenas vitórias — elas constroem autoestima
• Busque apoio profissional quando necessário: psicólogos, fonoaudiólogos, TOs',
 'O conceito de "dupla excepcionalidade" (twice exceptional ou 2e) descreve pessoas que são ao mesmo tempo superdotadas e neurodivergentes — uma combinação mais comum do que se imagina, especialmente em autistas e ADHDers.',
 'Uma família que cria um "canto tranquilo" em casa — um espaço silencioso, com iluminação suave e poucas distrações — para seu filho autista dar regulação sensorial reduz crises e melhora a qualidade de vida de todos.',
 'Autocuidado não é egoísmo — é estratégia. Quem apoia pessoas neurodivergentes sem cuidar de si mesmo esgota e perde a capacidade de ajudar. Cuide-se para poder cuidar.',
 'Ativo', 12);

-- Ajusta a sequence para novos módulos começarem em 13
SELECT setval(pg_get_serial_sequence('public.learning_modules','id'), 12, true);

-- --------------------------------------------------------------------------
-- 3. RLS em learning_modules
-- --------------------------------------------------------------------------
ALTER TABLE public.learning_modules ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "lm_select_auth" ON public.learning_modules;
CREATE POLICY "lm_select_auth"
  ON public.learning_modules FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "lm_write_admin" ON public.learning_modules;
CREATE POLICY "lm_write_admin"
  ON public.learning_modules FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- --------------------------------------------------------------------------
-- 4. Função add_learning_xp — incrementa XP e recalcula nível
-- --------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.add_learning_xp(p_user_id uuid, p_xp int)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_new_xp  int;
  v_new_lvl int;
BEGIN
  UPDATE profiles
     SET xp = COALESCE(xp, 0) + p_xp
   WHERE id = p_user_id
  RETURNING xp INTO v_new_xp;

  IF NOT FOUND THEN RETURN; END IF;

  v_new_lvl := GREATEST(1, FLOOR(v_new_xp / 100) + 1);
  UPDATE profiles SET level = v_new_lvl WHERE id = p_user_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.add_learning_xp(uuid, int) TO authenticated;

-- --------------------------------------------------------------------------
-- 5. UNIQUE em study_blocks (user_id, date, time) — evita horário duplicado
-- --------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'study_blocks_user_date_time_unique'
  ) THEN
    ALTER TABLE public.study_blocks
      ADD CONSTRAINT study_blocks_user_date_time_unique
      UNIQUE (user_id, date, time);
  END IF;
END $$;

-- --------------------------------------------------------------------------
-- 6. RLS em challenges e challenge_questions (admin write, todos leem)
-- --------------------------------------------------------------------------

-- challenges
DROP POLICY IF EXISTS "challenges_admin_write" ON public.challenges;
CREATE POLICY "challenges_admin_write" ON public.challenges
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "challenges_read_all" ON public.challenges;
CREATE POLICY "challenges_read_all" ON public.challenges
  FOR SELECT USING (true);

-- challenge_questions
ALTER TABLE public.challenge_questions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "cq_select_auth" ON public.challenge_questions;
CREATE POLICY "cq_select_auth" ON public.challenge_questions
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "cq_write_admin" ON public.challenge_questions;
CREATE POLICY "cq_write_admin" ON public.challenge_questions
  FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

-- --------------------------------------------------------------------------
-- 7. UUID automático em challenge_questions.id (se ainda não tiver default)
-- --------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name   = 'challenge_questions'
      AND column_name  = 'id'
      AND column_default IS NOT NULL
  ) THEN
    ALTER TABLE public.challenge_questions
      ALTER COLUMN id SET DEFAULT gen_random_uuid();
  END IF;
END $$;

-- --------------------------------------------------------------------------
-- 8. Verificação — retorna módulos seedados
-- --------------------------------------------------------------------------
SELECT id, titulo, nivel, xp, status, position
FROM public.learning_modules
ORDER BY position;
