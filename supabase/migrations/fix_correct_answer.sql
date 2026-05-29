-- =====================================================================
--  MINDLY — Fix: adicionar e preencher correct_answer
--  Execute no SQL Editor do Supabase em DOIS passos separados.
-- =====================================================================

-- =====================================================================
--  PASSO 1 — Adicionar a coluna correct_answer (execute e confirme)
-- =====================================================================
ALTER TABLE public.challenge_questions
ADD COLUMN IF NOT EXISTS correct_answer text;

-- Garante política de leitura para usuários autenticados
ALTER TABLE public.challenge_questions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "challenge_questions_read_all" ON public.challenge_questions;
CREATE POLICY "challenge_questions_read_all" ON public.challenge_questions
  FOR SELECT USING (true);

-- =====================================================================
--  PASSO 2 — Ver todas as perguntas para identificar o gabarito
--  Execute esta query para ver o conteúdo de cada pergunta:
-- =====================================================================
  SELECT
    id,
    LEFT(question, 80)  AS pergunta,
    option_a            AS "A",
    option_b            AS "B",
    option_c            AS "C",
    option_d            AS "D",
    correct_answer      AS gabarito_atual
  FROM public.challenge_questions
  ORDER BY challenge_id, created_at;

-- =====================================================================
--  PASSO 3 — Preencher o gabarito de cada pergunta
--  Substitua <uuid> pelo id real da pergunta (visto no Passo 2).
--  O valor de correct_answer deve ser: 'a', 'b', 'c' ou 'd' (minúsculo).
--
--  Exemplo:
--    UPDATE public.challenge_questions SET correct_answer = 'b' WHERE id = '<uuid>';
--
--  OU use UPDATE em lote por challenge_id:
--
--    UPDATE public.challenge_questions SET correct_answer = 'a'
--    WHERE challenge_id = '<uuid-do-desafio>'
--    AND correct_answer IS NULL;
--
-- =====================================================================

-- =====================================================================
--  VERIFICAÇÃO FINAL — após preencher, confirme com esta query:
-- =====================================================================
/*
SELECT
  c.title                 AS desafio,
  LEFT(cq.question, 60)   AS pergunta,
  cq.correct_answer       AS gabarito,
  CASE cq.correct_answer
    WHEN 'a' THEN cq.option_a
    WHEN 'b' THEN cq.option_b
    WHEN 'c' THEN cq.option_c
    WHEN 'd' THEN cq.option_d
    ELSE '⚠️ SEM GABARITO'
  END                     AS resposta_correta
FROM public.challenge_questions cq
JOIN public.challenges c ON c.id = cq.challenge_id
ORDER BY c.title, cq.created_at;
*/
