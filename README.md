# 🧠 Mindly

Plataforma de organização de estudos com gamificação — planner, desafios,
trilha de aprendizagem, recompensas e painel administrativo.

Refatorado de **Create React App + Firebase** para **Vite + React 18 + Supabase**,
com arquitetura em camadas, backend completo e persistência real.

---

## 🚀 Stack

- **Vite** + **React 18** + **React Router v6**
- **Supabase** (autenticação + banco PostgreSQL + Row Level Security)
- **lucide-react** (ícones)
- CSS puro com a identidade visual original preservada

---

## 📁 Estrutura

```
mindly/
├── public/                  # favicon, logos, imagens estáticas
├── src/
│   ├── assets/              # imagens importadas no código
│   ├── components/
│   │   ├── auth/            # ProtectedRoute
│   │   ├── layout/          # Navbar, Footer
│   │   ├── sections/        # Hero, Tools, Pricing, Contact, Rewards...
│   │   └── ui/              # ConfigWarning
│   ├── context/            # AuthContext (sessão + perfil)
│   ├── data/               # conteúdo estático (trilha, jogos)
│   ├── hooks/              # useToast
│   ├── lib/                # supabaseClient, icons
│   ├── pages/              # Home, Login, Planner, Admin, etc.
│   ├── services/           # camada de acesso ao Supabase
│   ├── styles/             # CSS por página + global
│   ├── App.jsx             # rotas
│   └── main.jsx            # entrada
└── supabase/
    └── schema.sql          # 👉 todo o backend (cole no Supabase)
```

---

## ⚙️ Como rodar

### 1. Instale as dependências

```bash
npm install
```

### 2. Crie o projeto no Supabase

1. Acesse [supabase.com](https://supabase.com) e crie um projeto.
2. Vá em **SQL Editor → New query**, cole **todo** o conteúdo de
   `supabase/schema.sql` e clique em **RUN**.
   Isso cria tabelas, relacionamentos, RLS, triggers, funções e dados iniciais.
3. Em **Authentication → Providers**, habilite **Email**
   (e **Google**, se quiser login social).

### 3. Configure as variáveis de ambiente

Copie o exemplo e preencha com as credenciais do seu projeto
(em **Project Settings → API**):

```bash
cp .env.example .env
```

```env
VITE_SUPABASE_URL=https://SEU-PROJETO.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anon-aqui
```

> A chave `anon` é segura no frontend — a proteção real vem das políticas
> de Row Level Security definidas no `schema.sql`.

### 4. Rode o projeto

```bash
npm run dev
```

Acesse `http://localhost:3000`.

---

## 👤 Tornando alguém Admin

O e-mail `vitoraugusto1079@gmail.com` já vira admin automaticamente no cadastro
(definido no trigger `handle_new_user`). Para promover outro usuário:

```sql
update public.profiles set role = 'admin' where email = 'seu@email.com';
```

Usuários admin veem o **Painel Admin** (dashboard, usuários, planos, desafios,
tickets) ao acessar `/perfil` ou `/admin`.

---

## ✨ Funcionalidades

| Página        | O que faz                                                            |
|---------------|----------------------------------------------------------------------|
| **Home**      | Landing com seções, planos (do banco) e formulário de contato real   |
| **Login/Cadastro** | Autenticação real via Supabase (e-mail/senha + Google)          |
| **Planner**   | Blocos de estudo por dia, persistidos; timer de pausa                |
| **Desafios**  | Progresso real por desafio + mini-jogos que dão moedas               |
| **Desempenho**| Conquistas, progresso por disciplina e loja de recompensas           |
| **Trilha**    | Trilha de neurodiversidade com leitura por voz (TTS) e progresso     |
| **Perfil**    | Dados reais do usuário (XP, nível, moedas, ofensiva)                 |
| **Admin**     | CRUD de usuários, planos, desafios e tickets + dashboard com gráfico |

---

## 🔐 Segurança

Todas as tabelas usam **Row Level Security**. Regras principais:

- Cada usuário só lê/edita os próprios dados (planner, progresso, recompensas).
- Catálogos (desafios, recompensas, planos) são públicos para leitura, mas só
  o admin escreve.
- Operações sensíveis (somar progresso, comprar recompensa) usam funções RPC
  `security definer` que validam tudo no servidor.

---

## 📜 Scripts

```bash
npm run dev       # desenvolvimento
npm run build     # build de produção
npm run preview   # pré-visualiza o build
npm run lint      # checagem de lint
```
