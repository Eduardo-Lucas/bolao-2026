export const SCORE_EXACT  = 15;
export const SCORE_RESULT = 5;

export function calcPoints(bet, result) {
  if (!bet || !result) return null;
  if (parseInt(bet.home_score) === parseInt(result.home_score) && parseInt(bet.away_score) === parseInt(result.away_score)) return SCORE_EXACT;
  const bSign = Math.sign(parseInt(bet.home_score) - parseInt(bet.away_score));
  const rSign = Math.sign(parseInt(result.home_score) - parseInt(result.away_score));
  if (bSign === rSign) return SCORE_RESULT;
  return 0;
}

export function totalPts(bets, results, games) {
  return games.reduce((acc, g) => {
    const b = bets?.find(b => b.game_id === g.id);
    const r = results?.find(r => r.game_id === g.id);
    return acc + (calcPoints(b, r) ?? 0);
  }, 0);
}

export function byGroup(games) {
  return games.reduce((acc, g) => {
    (acc[g.group] = acc[g.group] || []).push(g);
    return acc;
  }, {});
}

export function medal(i) { return ["🥇", "🥈", "🥉"][i] ?? `${i + 1}º`; }

export function resultLabel(pts) {
  if (pts === SCORE_EXACT)  return { label: "Placar exato",    color: "#00e676" };
  if (pts === SCORE_RESULT) return { label: "Resultado certo", color: "#ffd600" };
  return { label: "Errou", color: "#ff5252" };
}
