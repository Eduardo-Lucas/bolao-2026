# Bolão Copa 2026 🇧🇷⚽🏆

Aplicação web para bolão dos jogos do Brasil na fase de grupos da Copa do Mundo 2026 (Grupo C). Desenvolvida com React + Vite e Supabase como backend em tempo real.

## Stack

- **Frontend:** React 19 + Vite
- **Backend/BD:** Supabase (PostgreSQL)
- **Estilização:** CSS-in-JS inline (sem dependências extras)

## Funcionalidades

- Cadastro de participantes com valor de entrada configurável
- Registro de palpites para os 3 jogos do Brasil no Grupo C
- Placar em tempo real sincronizado via Supabase
- Ranking dinâmico com pontuação automática
- Painel admin protegido por senha para inserir resultados e gerenciar participantes

## Regras de pontuação

| Pontos | Critério |
|--------|----------|
| 15 | Placar exato (ex: apostou 2×1, foi 2×1) |
| 5  | Resultado certo (ex: apostou 0×0, foi 1×1 — ambos empate) |
| 0  | Errou |

Cota de entrada padrão: **R$ 30,00**

## Jogos — Grupo C

| Jogo | Data | Local |
|------|------|-------|
| 🇧🇷 Brasil × Marrocos 🇲🇦 | 13/06 (Sáb) 19h00 | MetLife Stadium, Nova York |
| 🇧🇷 Brasil × Haiti 🇭🇹 | 19/06 (Sex) 21h30 | Lincoln Financial Field, Filadélfia |
| 🇧🇷 Brasil × Escócia 🏴󠁧󠁢󠁳󠁣󠁴󠁿 | 24/06 (Qua) 19h00 | Hard Rock Stadium, Miami |

## Configuração do Supabase

Crie as tabelas abaixo no painel SQL do seu projeto Supabase:

```sql
create table players (
  id            uuid primary key default gen_random_uuid(),
  name          text unique not null,
  paid          numeric default 30,
  registered_at timestamptz default now()
);

create table bets (
  id         uuid primary key default gen_random_uuid(),
  player_id  uuid references players(id) on delete cascade,
  game_id    int not null,
  home_score int not null default 0,
  away_score int not null default 0,
  unique(player_id, game_id)
);

create table results (
  id         uuid primary key default gen_random_uuid(),
  game_id    int unique not null,
  home_score int not null default 0,
  away_score int not null default 0
);
```

Em seguida, configure as variáveis no início de `bolao-app/src/App.jsx`:

```js
const SUPABASE_URL = "sua-url-aqui";
const SUPABASE_KEY = "sua-chave-publishable-aqui";
```

## Instalação e execução

```bash
cd bolao-app
npm install
npm run dev
```

Acesse em `http://localhost:5173`.

## Painel Admin

Clique em **⚡ Admin** na navegação e use a senha `hexa2026` para:

- Inserir o resultado real de cada jogo
- Remover participantes
- Acompanhar palpites e pagamentos

## Estrutura do projeto

```
bolao-2026/
├── bolao-app/                  # Projeto React + Vite
│   ├── src/
│   │   └── App.jsx             # Componente principal (toda a lógica)
│   ├── index.html
│   └── vite.config.js
└── bolao-copa-2026-supabase.jsx  # Versão standalone do componente
```
