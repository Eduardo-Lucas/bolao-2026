import { describe, it, expect } from "vitest";
import {
  calcPoints, totalPts, byGroup, medal, resultLabel,
  SCORE_EXACT, SCORE_RESULT,
} from "./utils.js";

// ─── calcPoints ───────────────────────────────────────────────────────────────
describe("calcPoints", () => {
  it("retorna null quando falta palpite", () => {
    expect(calcPoints(null, { home_score: 1, away_score: 0 })).toBeNull();
  });

  it("retorna null quando falta resultado", () => {
    expect(calcPoints({ home_score: 1, away_score: 0 }, null)).toBeNull();
  });

  it("pontua placar exato", () => {
    expect(calcPoints({ home_score: 2, away_score: 1 }, { home_score: 2, away_score: 1 })).toBe(SCORE_EXACT);
  });

  it("pontua empate exato", () => {
    expect(calcPoints({ home_score: 0, away_score: 0 }, { home_score: 0, away_score: 0 })).toBe(SCORE_EXACT);
  });

  it("pontua resultado certo (vitória, placar errado)", () => {
    expect(calcPoints({ home_score: 1, away_score: 0 }, { home_score: 3, away_score: 1 })).toBe(SCORE_RESULT);
  });

  it("pontua resultado certo (empate, placar errado)", () => {
    expect(calcPoints({ home_score: 1, away_score: 1 }, { home_score: 2, away_score: 2 })).toBe(SCORE_RESULT);
  });

  it("retorna 0 quando erra o resultado", () => {
    expect(calcPoints({ home_score: 2, away_score: 0 }, { home_score: 0, away_score: 1 })).toBe(0);
  });

  it("retorna 0 quando apostou vitória mas foi empate", () => {
    expect(calcPoints({ home_score: 2, away_score: 1 }, { home_score: 1, away_score: 1 })).toBe(0);
  });

  it("aceita valores string (como vêm do input)", () => {
    expect(calcPoints({ home_score: "2", away_score: "1" }, { home_score: "2", away_score: "1" })).toBe(SCORE_EXACT);
  });
});

// ─── totalPts ─────────────────────────────────────────────────────────────────
const GAMES = [
  { id: 1, group: "C" },
  { id: 2, group: "C" },
  { id: 3, group: "C" },
];

describe("totalPts", () => {
  it("retorna 0 sem palpites", () => {
    expect(totalPts([], [], GAMES)).toBe(0);
  });

  it("soma pontos de múltiplos jogos", () => {
    const bets = [
      { game_id: 1, home_score: 2, away_score: 1 },
      { game_id: 2, home_score: 0, away_score: 0 },
    ];
    const results = [
      { game_id: 1, home_score: 2, away_score: 1 }, // exato → 15
      { game_id: 2, home_score: 1, away_score: 1 }, // resultado certo → 5
    ];
    expect(totalPts(bets, results, GAMES)).toBe(20);
  });

  it("ignora jogo sem resultado lançado", () => {
    const bets    = [{ game_id: 1, home_score: 1, away_score: 0 }];
    const results = [];
    expect(totalPts(bets, results, GAMES)).toBe(0);
  });

  it("ignora jogo sem palpite", () => {
    const bets    = [];
    const results = [{ game_id: 1, home_score: 1, away_score: 0 }];
    expect(totalPts(bets, results, GAMES)).toBe(0);
  });

  it("soma máxima (3 placares exatos)", () => {
    const bets    = GAMES.map(g => ({ game_id: g.id, home_score: 1, away_score: 0 }));
    const results = GAMES.map(g => ({ game_id: g.id, home_score: 1, away_score: 0 }));
    expect(totalPts(bets, results, GAMES)).toBe(SCORE_EXACT * 3);
  });
});

// ─── byGroup ──────────────────────────────────────────────────────────────────
describe("byGroup", () => {
  const games = [
    { id: 1, group: "A" },
    { id: 2, group: "B" },
    { id: 3, group: "A" },
  ];

  it("agrupa jogos pela chave group", () => {
    const grouped = byGroup(games);
    expect(grouped["A"]).toHaveLength(2);
    expect(grouped["B"]).toHaveLength(1);
  });

  it("preserva a ordem dentro do grupo", () => {
    const grouped = byGroup(games);
    expect(grouped["A"].map(g => g.id)).toEqual([1, 3]);
  });

  it("retorna objeto vazio para array vazio", () => {
    expect(byGroup([])).toEqual({});
  });
});

// ─── medal ────────────────────────────────────────────────────────────────────
describe("medal", () => {
  it("retorna emoji para top 3", () => {
    expect(medal(0)).toBe("🥇");
    expect(medal(1)).toBe("🥈");
    expect(medal(2)).toBe("🥉");
  });

  it("retorna posição numérica para demais", () => {
    expect(medal(3)).toBe("4º");
    expect(medal(9)).toBe("10º");
  });
});

// ─── resultLabel ──────────────────────────────────────────────────────────────
describe("resultLabel", () => {
  it("retorna label verde para placar exato", () => {
    const r = resultLabel(SCORE_EXACT);
    expect(r.label).toBe("Placar exato");
    expect(r.color).toBe("#00e676");
  });

  it("retorna label amarelo para resultado certo", () => {
    const r = resultLabel(SCORE_RESULT);
    expect(r.label).toBe("Resultado certo");
    expect(r.color).toBe("#ffd600");
  });

  it("retorna label vermelho para erro", () => {
    const r = resultLabel(0);
    expect(r.label).toBe("Errou");
    expect(r.color).toBe("#ff5252");
  });
});
