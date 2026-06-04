-- ═══════════════════════════════════════════════════════════════════════════════
-- Bolão Copa 2026 — Configuração de Row Level Security
-- Execute este script no SQL Editor do Supabase (uma vez)
-- ═══════════════════════════════════════════════════════════════════════════════

-- ── 1. Reativar RLS em todas as tabelas ────────────────────────────────────────
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE bets    ENABLE ROW LEVEL SECURITY;
ALTER TABLE results ENABLE ROW LEVEL SECURITY;

-- ── 2. Remover políticas antigas (se existirem) ────────────────────────────────
DROP POLICY IF EXISTS "players_anon_select" ON players;
DROP POLICY IF EXISTS "players_anon_insert" ON players;
DROP POLICY IF EXISTS "bets_anon_select"    ON bets;
DROP POLICY IF EXISTS "bets_anon_insert"    ON bets;
DROP POLICY IF EXISTS "bets_anon_update"    ON bets;
DROP POLICY IF EXISTS "results_anon_select" ON results;

-- ── 3. View: players_public ────────────────────────────────────────────────────
-- Expõe players sem a coluna pin; usada pelo frontend para listar participantes
DROP VIEW IF EXISTS players_public;
CREATE VIEW players_public AS
  SELECT id, name, paid, registered_at FROM players;

-- anon pode ler a view (herda RLS da tabela base)
GRANT SELECT ON players_public TO anon;

-- ── 4. Tabela: players ─────────────────────────────────────────────────────────
-- anon pode listar participantes (ranking, seleção de jogador)
CREATE POLICY "players_anon_select"
  ON players FOR SELECT TO anon USING (true);

-- anon pode cadastrar novo participante
CREATE POLICY "players_anon_insert"
  ON players FOR INSERT TO anon WITH CHECK (true);

-- UPDATE e DELETE: apenas service_role via Edge Functions
-- (sem policy para anon → bloqueado por padrão pelo RLS)

-- Ocultar coluna pin do papel anon — impede leitura direta via API
REVOKE SELECT (pin) ON players FROM anon;

-- ── 5. Tabela: bets ────────────────────────────────────────────────────────────
-- anon pode ler todos os palpites (ranking)
CREATE POLICY "bets_anon_select"
  ON bets FOR SELECT TO anon USING (true);

-- anon pode inserir e atualizar palpites (upsert)
CREATE POLICY "bets_anon_insert"
  ON bets FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "bets_anon_update"
  ON bets FOR UPDATE TO anon USING (true);

-- DELETE de apostas não é usado no fluxo — bloqueado por padrão

-- ── 6. Tabela: results ─────────────────────────────────────────────────────────
-- anon pode ler resultados (ranking, palpites com pontuação)
CREATE POLICY "results_anon_select"
  ON results FOR SELECT TO anon USING (true);

-- INSERT, UPDATE, DELETE: apenas service_role via Edge Function admin-action
-- (sem policy para anon → bloqueado por padrão pelo RLS)
