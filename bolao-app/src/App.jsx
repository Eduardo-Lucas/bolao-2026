import { useState, useEffect, useCallback } from "react";
import { createClient } from "@supabase/supabase-js";
import { SCORE_EXACT, SCORE_RESULT, calcPoints, totalPts, byGroup, medal, resultLabel } from "./utils.js";

// ─── SUPABASE ─────────────────────────────────────────────────────────────────
const SUPABASE_URL = "https://jrxrnwkxrabswicwlsqv.supabase.co";
const SUPABASE_KEY = "sb_publishable_1AEAwrQdLvHT75nPfuk5OA_FySbqTle";
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ─── CONFIG ───────────────────────────────────────────────────────────────────
const ENTRY_FEE = 30;
const ADMIN_PASSWORD = "hexa2026";

const GAMES = [
  // ── Grupo C ──────────────────────────────────────────────────────────────────
  { id: 1, group: "C", home: "Brasil",   away: "Marrocos", homeFlag: "🇧🇷", awayFlag: "🇲🇦", date: "13/06 (Sáb) • 19h00", venue: "MetLife Stadium, Nova York" },
  { id: 2, group: "C", home: "Brasil",   away: "Haiti",    homeFlag: "🇧🇷", awayFlag: "🇭🇹", date: "19/06 (Sex) • 21h30", venue: "Lincoln Financial Field, Filadélfia" },
  { id: 3, group: "C", home: "Brasil",   away: "Escócia",  homeFlag: "🇧🇷", awayFlag: "🏴󠁧󠁢󠁳󠁣󠁴󠁿", date: "24/06 (Qua) • 19h00", venue: "Hard Rock Stadium, Miami" },
  // Adicione jogos de outros grupos abaixo, ex:
  // { id: 4, group: "A", home: "Time A", away: "Time B", homeFlag: "🏳️", awayFlag: "🏳️", date: "dd/MM • HHhMM", venue: "Estádio, Cidade" },
];

// ─── HELPERS ──────────────────────────────────────────────────────────────────

// ─── SCORE INPUT ──────────────────────────────────────────────────────────────
function ScoreInput({ value, onChange }) {
  return (
    <input
      type="number" min="0" max="20"
      value={value}
      onChange={e => onChange(Math.max(0, parseInt(e.target.value) || 0))}
      style={{
        width: 52, textAlign: "center", fontSize: 24, fontWeight: 800,
        background: "rgba(255,255,255,0.08)", border: "2px solid rgba(255,255,255,0.2)",
        borderRadius: 10, color: "#fff", padding: "6px 4px", outline: "none",
      }}
    />
  );
}

// ─── GAME CARD ────────────────────────────────────────────────────────────────
function GameCard({ game, bet, onBetChange, result, onResultChange, isAdmin, disabled }) {
  const pts = bet && result ? calcPoints(bet, result) : null;
  const rl  = pts !== null ? resultLabel(pts) : null;
  const bh  = bet?.home_score ?? 0;
  const ba  = bet?.away_score ?? 0;

  return (
    <div style={{
      background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)",
      borderRadius: 16, padding: "20px 24px", marginBottom: 14, position: "relative", overflow: "hidden",
    }}>
      <div style={{ position:"absolute", left:0, top:0, bottom:0, width:4, background:"linear-gradient(180deg,#009c3b,#ffdf00)" }} />
      <div style={{ fontSize: 11, color: "#888", marginBottom: 8, letterSpacing: 1 }}>
        {game.date} • {game.venue}
      </div>
      <div style={{ display:"flex", alignItems:"center", gap:12, justifyContent:"center", flexWrap:"wrap" }}>
        <span style={{ fontSize: 20, fontWeight: 700 }}>{game.homeFlag} {game.home}</span>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <ScoreInput value={bh} onChange={v => !disabled && onBetChange({ home_score: v, away_score: ba })} />
          <span style={{ fontSize: 18, color: "#555" }}>×</span>
          <ScoreInput value={ba} onChange={v => !disabled && onBetChange({ home_score: bh, away_score: v })} />
        </div>
        <span style={{ fontSize: 20, fontWeight: 700 }}>{game.away} {game.awayFlag}</span>
      </div>

      {rl && (
        <div style={{ marginTop:10, textAlign:"center", fontSize:13, fontWeight:700, color: rl.color }}>
          {rl.label} • +{pts} pts
        </div>
      )}

      {isAdmin && (
        <div style={{ marginTop:14, borderTop:"1px solid rgba(255,255,255,0.08)", paddingTop:12 }}>
          <div style={{ fontSize:11, color:"#ffd600", marginBottom:8, letterSpacing:1 }}>⚡ RESULTADO REAL</div>
          <div style={{ display:"flex", alignItems:"center", gap:8, justifyContent:"center" }}>
            <ScoreInput value={result?.home_score ?? 0} onChange={v => onResultChange({ home_score: v, away_score: result?.away_score ?? 0 })} />
            <span style={{ color:"#555" }}>×</span>
            <ScoreInput value={result?.away_score ?? 0} onChange={v => onResultChange({ home_score: result?.home_score ?? 0, away_score: v })} />
            {result && (
              <button onClick={() => onResultChange(null)} style={{
                background:"rgba(255,82,82,0.15)", border:"1px solid #ff5252",
                borderRadius:6, color:"#ff5252", padding:"4px 10px", cursor:"pointer", fontSize:11,
              }}>Limpar</button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
export default function App() {
  const [players,  setPlayers]  = useState([]);
  const [betsMap,  setBetsMap]  = useState({});
  const [results,  setResults]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [dbError,  setDbError]  = useState(null);

  const [view,          setView]          = useState("home");
  const [currentPlayer, setCurrentPlayer] = useState(null);
  const [localBets,     setLocalBets]     = useState({});
  const [adminMode,     setAdminMode]     = useState(false);
  const [adminPass,     setAdminPass]     = useState("");
  const [adminErr,      setAdminErr]      = useState(false);
  const [localResults,  setLocalResults]  = useState({});
  const [msg,           setMsg]           = useState("");
  const [saving,        setSaving]        = useState(false);

  const [newName, setNewName] = useState("");
  const [newPaid, setNewPaid] = useState(ENTRY_FEE);

  function flash(text, isErr = false) {
    setMsg({ text, isErr });
    setTimeout(() => setMsg(""), 3500);
  }

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setDbError(null);
    try {
      const [{ data: pl, error: e1 }, { data: bt, error: e2 }, { data: rs, error: e3 }] =
        await Promise.all([
          supabase.from("players").select("*").order("registered_at"),
          supabase.from("bets").select("*"),
          supabase.from("results").select("*"),
        ]);
      if (e1 || e2 || e3) throw e1 || e2 || e3;
      setPlayers(pl || []);
      const bm = {};
      (bt || []).forEach(b => { bm[b.player_id] = bm[b.player_id] || []; bm[b.player_id].push(b); });
      setBetsMap(bm);
      setResults(rs || []);
    } catch (err) {
      setDbError(err?.message || "Erro ao conectar com o banco. Verifique as tabelas no Supabase.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  useEffect(() => {
    const m = {};
    results.forEach(r => { m[r.game_id] = r; });
    setLocalResults(m);
  }, [results]);

  async function handleRegister() {
    if (!newName.trim()) return;
    setSaving(true);
    const { data, error } = await supabase
      .from("players")
      .insert({ name: newName.trim(), paid: parseFloat(newPaid) || ENTRY_FEE })
      .select()
      .single();
    setSaving(false);
    if (error) { flash("⚠️ " + (error.message.includes("unique") ? "Nome já cadastrado." : error.message), true); return; }
    setPlayers(prev => [...prev, data]);
    setBetsMap(prev => ({ ...prev, [data.id]: [] }));
    setCurrentPlayer(data);
    setLocalBets({});
    setNewName("");
    setNewPaid(ENTRY_FEE);
    setView("bet");
    flash("✅ Cadastrado! Faça seus palpites.");
  }

  async function handleSaveBets() {
    if (!currentPlayer) return;
    setSaving(true);
    const rows = GAMES.map(g => ({
      player_id: currentPlayer.id,
      game_id: g.id,
      home_score: parseInt(localBets[g.id]?.home_score ?? 0),
      away_score: parseInt(localBets[g.id]?.away_score ?? 0),
    }));
    const { error } = await supabase.from("bets").upsert(rows, { onConflict: "player_id,game_id" });
    setSaving(false);
    if (error) { flash("❌ Erro ao salvar: " + error.message, true); return; }
    setBetsMap(prev => ({ ...prev, [currentPlayer.id]: rows }));
    flash("✅ Palpites salvos!");
  }

  async function handleSaveResult(gameId, result) {
    if (result === null) {
      await supabase.from("results").delete().eq("game_id", gameId);
      setResults(prev => prev.filter(r => r.game_id !== gameId));
      return;
    }
    const row = { game_id: gameId, home_score: parseInt(result.home_score), away_score: parseInt(result.away_score) };
    const { error } = await supabase.from("results").upsert(row, { onConflict: "game_id" });
    if (error) { flash("❌ " + error.message, true); return; }
    setResults(prev => { const f = prev.filter(r => r.game_id !== gameId); return [...f, row]; });
    flash("✅ Resultado salvo!");
  }

  async function handleDeletePlayer(id) {
    await supabase.from("players").delete().eq("id", id);
    setPlayers(prev => prev.filter(p => p.id !== id));
    setBetsMap(prev => { const n = { ...prev }; delete n[id]; return n; });
  }

  const ranked = [...players]
    .map(p => ({ ...p, total: totalPts(betsMap[p.id], results, GAMES) }))
    .sort((a, b) => b.total - a.total || a.name.localeCompare(b.name));

  const totalPool = players.reduce((s, p) => s + (parseFloat(p.paid) || 0), 0);

  const S = {
    app:   { minHeight:"100vh", background:"#0a0f14", color:"#fff", fontFamily:"'Segoe UI',system-ui,sans-serif", paddingBottom:48 },
    hdr:   { background:"linear-gradient(135deg,#006400,#009c3b 50%,#006400)", padding:"24px 20px 20px", textAlign:"center", position:"relative", overflow:"hidden" },
    hdrBg: { position:"absolute", inset:0, background:"repeating-linear-gradient(45deg,rgba(255,223,0,0.05) 0,rgba(255,223,0,0.05) 2px,transparent 2px,transparent 20px)" },
    nav:   { display:"flex", gap:8, justifyContent:"center", padding:"16px 16px 0", flexWrap:"wrap" },
    navB:  (a) => ({ padding:"8px 16px", borderRadius:20, border: a?"2px solid #ffdf00":"2px solid rgba(255,255,255,0.15)", background: a?"rgba(255,223,0,0.15)":"transparent", color: a?"#ffdf00":"#ccc", fontWeight:700, fontSize:13, cursor:"pointer" }),
    wrap:  { maxWidth:600, margin:"0 auto", padding:"20px 16px" },
    card:  { background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:16, padding:24, marginBottom:16 },
    inp:   { width:"100%", background:"rgba(255,255,255,0.07)", border:"1px solid rgba(255,255,255,0.15)", borderRadius:10, padding:"10px 14px", color:"#fff", fontSize:15, outline:"none", boxSizing:"border-box" },
    btn:   (bg="#009c3b",mt=8) => ({ padding:"12px 24px", borderRadius:12, border:"none", background:bg, color:"#fff", fontWeight:800, fontSize:15, cursor:"pointer", width:"100%", marginTop:mt, opacity: saving ? 0.6 : 1 }),
    lbl:   { fontSize:12, color:"#aaa", letterSpacing:1, marginBottom:4, display:"block" },
    sec:   { fontSize:18, fontWeight:800, marginBottom:16, color:"#ffdf00" },
    flash: (err) => ({ position:"fixed", bottom:20, left:"50%", transform:"translateX(-50%)", background: err?"#c62828":"#1b5e20", border:`1px solid ${err?"#ef9a9a":"#69f0ae"}`, color:"#fff", padding:"12px 24px", borderRadius:12, fontWeight:700, zIndex:999, boxShadow:"0 4px 20px rgba(0,0,0,0.5)", fontSize:14, whiteSpace:"nowrap" }),
  };

  if (loading) return (
    <div style={{ ...S.app, display:"flex", alignItems:"center", justifyContent:"center", flexDirection:"column", gap:16 }}>
      <div style={{ fontSize:40 }}>⚽</div>
      <div style={{ color:"#aaa" }}>Conectando ao banco de dados…</div>
    </div>
  );

  if (dbError) return (
    <div style={{ ...S.app, display:"flex", alignItems:"center", justifyContent:"center", flexDirection:"column", gap:16, padding:24 }}>
      <div style={{ fontSize:40 }}>❌</div>
      <div style={{ color:"#ff5252", fontWeight:700, textAlign:"center" }}>Erro de conexão</div>
      <div style={{ color:"#aaa", fontSize:14, textAlign:"center", maxWidth:400 }}>{dbError}</div>
      <div style={{ background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:12, padding:16, fontSize:13, color:"#ccc", maxWidth:400, lineHeight:1.7 }}>
        Verifique se executou o SQL de criação das tabelas no Supabase:<br/>
        <code style={{ color:"#ffd600" }}>players</code>, <code style={{ color:"#ffd600" }}>bets</code>, <code style={{ color:"#ffd600" }}>results</code>
      </div>
      <button style={{ ...S.btn(), width:"auto", padding:"10px 32px" }} onClick={fetchAll}>Tentar novamente</button>
    </div>
  );

  const renderHome = () => (
    <div style={S.wrap}>
      <div style={{ ...S.card, background:"linear-gradient(135deg,rgba(0,156,59,0.3),rgba(0,50,20,0.5))", border:"1px solid rgba(0,200,80,0.3)", textAlign:"center" }}>
        <div style={{ fontSize:13, color:"#aaa", letterSpacing:1 }}>💰 PREMIAÇÃO ACUMULADA</div>
        <div style={{ fontSize:52, fontWeight:900, color:"#00e676", lineHeight:1.1 }}>
          R$ {totalPool.toFixed(2).replace(".",",")}
        </div>
        <div style={{ fontSize:13, color:"#aaa", marginTop:4 }}>
          {players.length} participante{players.length!==1?"s":""} • R$ {ENTRY_FEE},00/cota
        </div>
      </div>

      <div style={S.card}>
        <div style={S.sec}>📋 Regras do Bolão</div>
        {[[15,"🟢","Placar exato","ex: apostou 2×1, foi 2×1"],[5,"🟡","Resultado certo","ex: apostou 0×0, foi 1×1"],[0,"🔴","Errou tudo","resultado diferente"]].map(([p,e,t,d])=>(
          <div key={p} style={{ display:"flex", gap:12, alignItems:"flex-start", padding:"10px 14px", background:"rgba(255,255,255,0.04)", borderRadius:10, marginBottom:8 }}>
            <span style={{ fontSize:20 }}>{e}</span>
            <div><span style={{ fontWeight:800, color:"#ffdf00" }}>{p} pts</span><span style={{ color:"#bbb", marginLeft:8, fontSize:14 }}>— {t}: {d}</span></div>
          </div>
        ))}
      </div>

      <div style={S.card}>
        <div style={S.sec}>⚽ Jogos</div>
        {Object.entries(byGroup(GAMES)).map(([group, games]) => (
          <div key={group}>
            <div style={{ fontSize:11, color:"#ffd600", letterSpacing:2, fontWeight:700, marginBottom:8, marginTop:8 }}>GRUPO {group}</div>
            {games.map(g => {
              const r = results.find(r => r.game_id === g.id);
              return (
                <div key={g.id} style={{ padding:"12px 16px", borderRadius:10, background:"rgba(255,255,255,0.04)", marginBottom:8, borderLeft:"3px solid #009c3b" }}>
                  <div style={{ fontWeight:700 }}>{g.homeFlag} {g.home} × {g.away} {g.awayFlag}</div>
                  <div style={{ fontSize:12, color:"#aaa", marginTop:2 }}>{g.date} • {g.venue}</div>
                  {r && <div style={{ fontSize:13, color:"#00e676", marginTop:4, fontWeight:700 }}>Resultado: {r.home_score} × {r.away_score}</div>}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      <button style={S.btn()} onClick={() => setView("register")}>➕ Participar do Bolão</button>
      <button style={S.btn("rgba(255,255,255,0.08)")} onClick={() => { fetchAll(); setView("ranking"); }}>🏆 Ver Ranking</button>
      {players.length > 0 && (
        <button style={S.btn("rgba(255,255,255,0.05)")} onClick={() => setView("selectPlayer")}>✏️ Editar palpites</button>
      )}
    </div>
  );

  const renderRegister = () => (
    <div style={S.wrap}>
      <div style={S.card}>
        <div style={S.sec}>➕ Novo Participante</div>
        <label style={S.lbl}>SEU NOME</label>
        <input style={{ ...S.inp, marginBottom:12 }} placeholder="Ex: João Silva" value={newName} onChange={e=>setNewName(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handleRegister()} />
        <label style={S.lbl}>VALOR PAGO (R$)</label>
        <input style={S.inp} type="number" min="1" value={newPaid} onChange={e=>setNewPaid(e.target.value)} />
        <div style={{ fontSize:12, color:"#aaa", marginTop:6 }}>Sugestão: R$ {ENTRY_FEE},00 por cota</div>
        <button style={S.btn()} onClick={handleRegister} disabled={saving}>{saving?"Salvando…":"Cadastrar e fazer palpites →"}</button>
        <button style={{ ...S.btn("transparent"), border:"1px solid rgba(255,255,255,0.1)" }} onClick={() => setView("home")}>Cancelar</button>
      </div>
    </div>
  );

  const renderBet = () => {
    if (!currentPlayer) return null;
    return (
      <div style={S.wrap}>
        <div style={{ textAlign:"center", marginBottom:20 }}>
          <div style={{ fontSize:20, fontWeight:800 }}>🇧🇷 Palpites de {currentPlayer.name}</div>
          <div style={{ fontSize:13, color:"#aaa", marginTop:4 }}>Digite o placar que você acredita</div>
        </div>
        {Object.entries(byGroup(GAMES)).map(([group, games]) => (
          <div key={group}>
            <div style={{ fontSize:11, color:"#ffd600", letterSpacing:2, fontWeight:700, marginBottom:10, marginTop:4 }}>GRUPO {group}</div>
            {games.map(g => {
              const r = results.find(r => r.game_id === g.id);
              return (
                <GameCard key={g.id} game={g}
                  bet={localBets[g.id] || { home_score:0, away_score:0 }}
                  onBetChange={v => setLocalBets(prev => ({ ...prev, [g.id]: v }))}
                  result={r} onResultChange={()=>{}} isAdmin={false}
                />
              );
            })}
          </div>
        ))}
        <button style={S.btn()} onClick={handleSaveBets} disabled={saving}>{saving?"Salvando…":"💾 Salvar Palpites"}</button>
        <button style={{ ...S.btn("transparent"), border:"1px solid rgba(255,255,255,0.1)" }} onClick={() => setView("selectPlayer")}>← Trocar jogador</button>
      </div>
    );
  };

  const renderSelectPlayer = () => (
    <div style={S.wrap}>
      <div style={S.sec}>✏️ Selecionar jogador</div>
      {players.map(p => (
        <div key={p.id} onClick={() => {
          setCurrentPlayer(p);
          const m = {};
          (betsMap[p.id] || []).forEach(b => { m[b.game_id] = b; });
          setLocalBets(m);
          setView("bet");
        }} style={{ ...S.card, cursor:"pointer", display:"flex", justifyContent:"space-between", alignItems:"center", padding:"14px 20px" }}>
          <span style={{ fontWeight:700 }}>🇧🇷 {p.name}</span>
          <span style={{ color:"#aaa", fontSize:13 }}>Editar →</span>
        </div>
      ))}
      <button style={{ ...S.btn("transparent"), border:"1px solid rgba(255,255,255,0.1)" }} onClick={() => setView("home")}>← Voltar</button>
    </div>
  );

  const renderRanking = () => (
    <div style={S.wrap}>
      <div style={{ ...S.card, textAlign:"center", background:"linear-gradient(135deg,rgba(255,215,0,0.15),rgba(180,140,0,0.1))", border:"1px solid rgba(255,215,0,0.2)", marginBottom:20 }}>
        <div style={{ fontSize:13, color:"#aaa" }}>💰 PRÊMIO TOTAL</div>
        <div style={{ fontSize:40, fontWeight:900, color:"#ffd600" }}>R$ {totalPool.toFixed(2).replace(".",",")}</div>
        <div style={{ fontSize:12, color:"#aaa" }}>{players.length} participante{players.length!==1?"s":""}</div>
      </div>

      {ranked.length === 0 ? (
        <div style={{ textAlign:"center", color:"#aaa", padding:40 }}>Nenhum participante ainda.</div>
      ) : ranked.map((p, i) => (
        <div key={p.id} style={{ ...S.card, display:"flex", alignItems:"center", gap:16, padding:"16px 20px",
          border: i===0?"1px solid rgba(255,215,0,0.4)": i===1?"1px solid rgba(192,192,192,0.2)": i===2?"1px solid rgba(205,127,50,0.2)":"1px solid rgba(255,255,255,0.07)",
          background: i===0?"rgba(255,215,0,0.07)": i===1?"rgba(192,192,192,0.04)": i===2?"rgba(205,127,50,0.04)":"rgba(255,255,255,0.02)",
        }}>
          <div style={{ fontSize:28, minWidth:36, textAlign:"center" }}>{medal(i)}</div>
          <div style={{ flex:1 }}>
            <div style={{ fontWeight:800, fontSize:16 }}>{p.name}</div>
            <div style={{ display:"flex", gap:10, marginTop:4, flexWrap:"wrap" }}>
              {GAMES.map(g => {
                const b = betsMap[p.id]?.find(b => b.game_id === g.id);
                const r = results.find(r => r.game_id === g.id);
                const pts = calcPoints(b, r);
                return (
                  <div key={g.id} style={{ fontSize:12, color:"#aaa" }}>
                    {g.awayFlag} {b
                      ? <span style={{ color: pts!==null ? resultLabel(pts).color : "#fff" }}>{b.home_score}×{b.away_score}{pts!==null?` (+${pts})`:""}</span>
                      : <span style={{ color:"#444" }}>—</span>}
                  </div>
                );
              })}
            </div>
          </div>
          <div style={{ fontSize:28, fontWeight:900, color: i===0?"#ffd600":"#fff", minWidth:50, textAlign:"right" }}>
            {p.total}<div style={{ fontSize:11, color:"#aaa", fontWeight:400 }}>pts</div>
          </div>
        </div>
      ))}

      <button style={S.btn("rgba(255,255,255,0.06)")} onClick={fetchAll}>🔄 Atualizar</button>
      <button style={{ ...S.btn("transparent"), border:"1px solid rgba(255,255,255,0.1)" }} onClick={() => setView("home")}>← Voltar</button>
    </div>
  );

  const renderAdmin = () => (
    <div style={S.wrap}>
      <div style={S.sec}>⚡ Painel Admin</div>
      <div style={S.card}>
        <div style={{ fontWeight:700, marginBottom:16, color:"#ffd600" }}>📥 Inserir Resultados Reais</div>
        {Object.entries(byGroup(GAMES)).map(([group, games]) => (
          <div key={group}>
            <div style={{ fontSize:11, color:"#ffd600", letterSpacing:2, fontWeight:700, marginBottom:10, marginTop:8 }}>GRUPO {group}</div>
            {games.map(g => {
              const r = localResults[g.id];
              return (
                <GameCard key={g.id} game={g}
                  bet={{ home_score:0, away_score:0 }} onBetChange={()=>{}}
                  result={r}
                  onResultChange={async val => {
                    setLocalResults(prev => val===null ? (({[g.id]:_,...rest})=>rest)(prev) : { ...prev, [g.id]: { game_id:g.id, ...val } });
                    await handleSaveResult(g.id, val);
                  }}
                  isAdmin={true}
                />
              );
            })}
          </div>
        ))}
      </div>

      <div style={S.card}>
        <div style={{ fontWeight:700, marginBottom:16, color:"#ffd600" }}>👥 Participantes ({players.length})</div>
        {players.length===0 && <div style={{ color:"#aaa", fontSize:14 }}>Nenhum participante ainda.</div>}
        {players.map(p => (
          <div key={p.id} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"10px 0", borderBottom:"1px solid rgba(255,255,255,0.07)" }}>
            <div>
              <div style={{ fontWeight:700 }}>{p.name}</div>
              <div style={{ fontSize:12, color:"#aaa" }}>R$ {parseFloat(p.paid).toFixed(2)} • {(betsMap[p.id]||[]).length}/{GAMES.length} palpites</div>
            </div>
            <button onClick={() => handleDeletePlayer(p.id)} style={{ background:"rgba(255,82,82,0.15)", border:"1px solid #ff5252", borderRadius:8, color:"#ff5252", padding:"4px 12px", cursor:"pointer", fontSize:12 }}>
              Remover
            </button>
          </div>
        ))}
      </div>

      <button style={{ ...S.btn("transparent"), border:"1px solid rgba(255,255,255,0.1)" }} onClick={() => { setAdminMode(false); setView("home"); }}>← Sair do Admin</button>
    </div>
  );

  const renderAdminLogin = () => (
    <div style={S.wrap}>
      <div style={S.card}>
        <div style={S.sec}>🔐 Acesso Admin</div>
        <label style={S.lbl}>SENHA</label>
        <input style={S.inp} type="password" placeholder="Digite a senha…" value={adminPass}
          onChange={e => setAdminPass(e.target.value)}
          onKeyDown={e => { if (e.key==="Enter") { if (adminPass===ADMIN_PASSWORD) { setAdminMode(true); setAdminErr(false); setView("admin"); } else setAdminErr(true); }}}
        />
        {adminErr && <div style={{ color:"#ff5252", fontSize:13, marginTop:8 }}>❌ Senha incorreta.</div>}
        <button style={S.btn()} onClick={() => { if (adminPass===ADMIN_PASSWORD) { setAdminMode(true); setAdminErr(false); setView("admin"); } else setAdminErr(true); }}>Entrar</button>
        <button style={{ ...S.btn("transparent"), border:"1px solid rgba(255,255,255,0.1)" }} onClick={() => setView("home")}>Cancelar</button>
        <div style={{ fontSize:11, color:"#444", marginTop:12, textAlign:"center" }}>Senha padrão: hexa2026</div>
      </div>
    </div>
  );

  return (
    <div style={S.app}>
      <div style={S.hdr}>
        <div style={S.hdrBg} />
        <div style={{ position:"relative" }}>
          <div style={{ fontSize:36, marginBottom:4 }}>🇧🇷⚽🏆</div>
          <h1 style={{ fontSize:28, fontWeight:900, letterSpacing:-1, margin:0, textShadow:"0 2px 8px rgba(0,0,0,0.5)" }}>Bolão Copa 2026</h1>
          <div style={{ fontSize:13, color:"rgba(255,255,255,0.8)", marginTop:4 }}>Copa do Mundo 2026 • Dados em tempo real 🟢</div>
        </div>
      </div>

      <div style={S.nav}>
        {[["home","🏠 Início"],["register","➕ Participar"],["ranking","🏆 Ranking"],[adminMode?"admin":"adminLogin","⚡ Admin"]].map(([v,l])=>(
          <button key={v} style={S.navB(view===v||(v==="adminLogin"&&view==="admin"))} onClick={()=>setView(v)}>{l}</button>
        ))}
      </div>

      {view==="home"         && renderHome()}
      {view==="register"     && renderRegister()}
      {view==="bet"          && renderBet()}
      {view==="selectPlayer" && renderSelectPlayer()}
      {view==="ranking"      && renderRanking()}
      {view==="admin"        && renderAdmin()}
      {view==="adminLogin"   && renderAdminLogin()}

      {msg && <div style={S.flash(msg.isErr)}>{msg.text}</div>}
    </div>
  );
}
