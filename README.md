# Bolão Copa 2026

Aplicação web para bolão da Copa do Mundo 2026. Participantes se cadastram, fazem palpites nos placares dos jogos e acompanham o ranking em tempo real. Desenvolvida com React + Vite e Supabase como backend.

## Stack

| Camada | Tecnologia |
|--------|-----------|
| Frontend | React 19 + Vite 8 |
| Backend / BD | Supabase (PostgreSQL) |
| Testes | Vitest |
| Deploy | Vercel |
| Estilização | CSS-in-JS inline |

## Funcionalidades

- **Cadastro de participantes** com nome, valor de entrada e PIN de 4 dígitos
- **Palpites por grupo** para todos os 18 jogos cadastrados (6 seleções × 3 jogos)
- **Proteção por PIN** — editar palpites exige autenticação; troca de PIN disponível para o participante
- **Ranking em tempo real** com pontuação automática ao inserir resultados
- **Painel admin** protegido por senha para lançar resultados e gerenciar participantes
- **Deploy no Vercel** com roteamento SPA configurado

## Regras de pontuação

| Pontos | Critério | Exemplo |
|--------|----------|---------|
| 15 | Placar exato | Apostou 2×1, foi 2×1 |
| 5  | Resultado certo | Apostou 0×0, foi 1×1 (ambos empate) |
| 0  | Errou | Qualquer outro caso |

Cota de entrada padrão: **R$ 30,00**

## Jogos cadastrados

### Grupo C
| Jogo | Data | Local |
|------|------|-------|
| 🇧🇷 Brasil × Marrocos 🇲🇦 | 13/06 (Sáb) 19h00 | MetLife Stadium, Nova York |
| 🇧🇷 Brasil × Haiti 🇭🇹 | 19/06 (Sex) 21h30 | Lincoln Financial Field, Filadélfia |
| 🇧🇷 Brasil × Escócia 🏴󠁧󠁢󠁳󠁣󠁴󠁿 | 24/06 (Qua) 19h00 | Hard Rock Stadium, Miami |

### Grupo E
| Jogo | Data | Local |
|------|------|-------|
| 🇩🇪 Alemanha × Curaçao 🇨🇼 | 14/06 (Dom) 14h00 | NRG Stadium, Houston |
| 🇩🇪 Alemanha × Costa do Marfim 🇨🇮 | 20/06 (Sáb) 17h00 | BMO Field, Toronto |
| 🇪🇨 Equador × Alemanha 🇩🇪 | 25/06 (Qui) 17h00 | MetLife Stadium, Nova Jersey |

### Grupo H
| Jogo | Data | Local |
|------|------|-------|
| 🇪🇸 Espanha × Cabo Verde 🇨🇻 | 15/06 (Seg) 13h00 | Mercedes-Benz Stadium, Atlanta |
| 🇪🇸 Espanha × Arábia Saudita 🇸🇦 | 21/06 (Dom) 13h00 | Mercedes-Benz Stadium, Atlanta |
| 🇺🇾 Uruguai × Espanha 🇪🇸 | 26/06 (Sex) 21h00 | Estádio Akron, Guadalajara |

### Grupo I
| Jogo | Data | Local |
|------|------|-------|
| 🇫🇷 França × Senegal 🇸🇳 | 16/06 (Ter) 16h00 | MetLife Stadium, Nova Jersey |
| 🇫🇷 França × Iraque 🇮🇶 | 22/06 (Seg) 18h00 | Lincoln Financial Field, Filadélfia |
| 🇳🇴 Noruega × França 🇫🇷 | 26/06 (Sex) 16h00 | Gillette Stadium, Foxborough |

### Grupo J
| Jogo | Data | Local |
|------|------|-------|
| 🇦🇷 Argentina × Argélia 🇩🇿 | 16/06 (Ter) 22h00 | Arrowhead Stadium, Kansas City |
| 🇦🇷 Argentina × Áustria 🇦🇹 | 22/06 (Seg) 14h00 | AT&T Stadium, Arlington |
| 🇯🇴 Jordânia × Argentina 🇦🇷 | 27/06 (Sáb) 23h00 | AT&T Stadium, Arlington |

### Grupo K
| Jogo | Data | Local |
|------|------|-------|
| 🇵🇹 Portugal × RD Congo 🇨🇩 | 17/06 (Qua) 14h00 | NRG Stadium, Houston |
| 🇵🇹 Portugal × Uzbequistão 🇺🇿 | 23/06 (Ter) 14h00 | NRG Stadium, Houston |
| 🇨🇴 Colômbia × Portugal 🇵🇹 | 27/06 (Sáb) 20h30 | Hard Rock Stadium, Miami |

## Segurança

### Modelo de ameaça resolvido

| Vetor | Antes | Depois |
|-------|-------|--------|
| Senha admin no bundle JS | Visível em DevTools | Removida — vive só no env var do Edge Function |
| Deleção via API com `anon key` | Qualquer um podia deletar | Bloqueada por RLS; só `service_role` deleta |
| PINs de todos os usuários na resposta da API | Expostos na aba Network | `REVOKE SELECT (pin)` impede leitura pela `anon key` |
| Verificação de PIN client-side | Comparação no browser | Validada pelo servidor via Edge Function |
| Resultados inseríveis pela `anon key` | Qualquer um podia alterar | Bloqueado por RLS; só `service_role` escreve |

### Arquitetura

```
Browser (anon key)          Edge Functions (service_role)
─────────────────           ──────────────────────────────
SELECT players/bets/results  verify-pin   → lê pin, compara
INSERT players/bets          update-pin   → verifica + atualiza pin
UPSERT bets                  admin-action → valida senha, deleta/salva
```

A `anon key` exposta no bundle é **read-only** para o que importa: não escreve resultados, não deleta jogadores, não lê PINs.

## Configuração do Supabase

Execute o SQL abaixo no painel SQL do seu projeto Supabase:

```sql
create table players (
  id            uuid primary key default gen_random_uuid(),
  name          text unique not null,
  paid          numeric default 30,
  pin           text,
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

Execute também o script `supabase/rls-setup.sql` para habilitar o RLS e as políticas de segurança (veja a seção [Segurança](#segurança)).

Depois, atualize as credenciais no topo de `bolao-app/src/App.jsx`:

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

## Testes

```bash
cd bolao-app
npm test
```

Os testes cobrem a lógica de pontuação (`calcPoints`, `totalPts`), agrupamento de jogos (`byGroup`), medalhas (`medal`) e labels de resultado (`resultLabel`).

## Deploy das Edge Functions

Instale o [Supabase CLI](https://supabase.com/docs/guides/cli) e faça login:

```bash
supabase login
supabase link --project-ref <seu-project-ref>
```

Configure as variáveis de ambiente das funções:

```bash
supabase secrets set ADMIN_PASSWORD="sua-senha-segura"
```

> A `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` já são injetadas automaticamente pelo Supabase em Edge Functions — não precisa configurar.

Faça o deploy das três funções:

```bash
supabase functions deploy verify-pin
supabase functions deploy update-pin
supabase functions deploy admin-action
```

## Deploy no Vercel

O `vercel.json` na raiz já configura o build e o roteamento SPA:

```json
{
  "buildCommand": "npm --prefix bolao-app install && npm --prefix bolao-app run build",
  "outputDirectory": "bolao-app/dist",
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

Basta conectar o repositório ao Vercel — nenhuma configuração adicional é necessária.

## Painel Admin

Clique em **⚡ Admin** na navegação e use a senha `hexa2026` para:

- Lançar o resultado real de cada jogo (por grupo)
- Remover participantes
- Visualizar contagem de palpites e valor pago por participante

## Fluxo do participante

1. **Cadastro** — nome, valor pago e PIN de 4 dígitos
2. **Palpites** — placar para cada jogo de todos os grupos disponíveis
3. **Edição** — seleciona o nome na lista, digita o PIN e altera os palpites
4. **Troca de PIN** — disponível na tela inicial via "🔑 Alterar meu PIN"
5. **Ranking** — visualização em tempo real com pontos por jogo e total

## Estrutura do projeto

```
bolao-2026/
├── supabase/
│   ├── functions/
│   │   ├── verify-pin/         # Valida PIN de um participante (server-side)
│   │   │   └── index.ts
│   │   ├── update-pin/         # Verifica PIN atual e atualiza para novo
│   │   │   └── index.ts
│   │   └── admin-action/       # Login admin + delete-player/save-result
│   │       └── index.ts
│   └── rls-setup.sql           # Script de RLS — execute uma vez no Supabase
├── bolao-app/                  # Projeto React + Vite
│   ├── src/
│   │   ├── App.jsx             # Componente principal e toda a UI
│   │   ├── utils.js            # Lógica de pontuação (pura, testável)
│   │   └── utils.test.js       # Testes unitários (Vitest)
│   ├── public/
│   │   └── favicon.svg
│   ├── vercel.json             # Roteamento SPA (fallback local)
│   ├── index.html
│   └── vite.config.js
├── vercel.json                 # Build config para deploy na raiz
└── bolao-copa-2026-supabase.jsx  # Versão standalone do componente
```
