import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  try {
    const { action, admin_password, ...params } = await req.json();

    if (!admin_password || admin_password !== Deno.env.get("ADMIN_PASSWORD")) {
      return json({ error: "Senha incorreta." }, 401);
    }

    // Usado pelo login do painel admin para validar a senha antes de mostrar a UI
    if (action === "verify") return json({ valid: true });

    const sb = adminClient();

    if (action === "delete-player") {
      const { player_id } = params;
      if (!player_id) return json({ error: "player_id obrigatório." }, 400);
      const { error } = await sb.from("players").delete().eq("id", player_id);
      if (error) return json({ error: error.message }, 500);
      return json({ success: true });
    }

    if (action === "save-result") {
      const { game_id, home_score, away_score } = params;
      if (game_id === undefined) return json({ error: "game_id obrigatório." }, 400);
      const { error } = await sb.from("results").upsert(
        { game_id, home_score: parseInt(home_score), away_score: parseInt(away_score) },
        { onConflict: "game_id" },
      );
      if (error) return json({ error: error.message }, 500);
      return json({ success: true });
    }

    if (action === "delete-result") {
      const { game_id } = params;
      if (game_id === undefined) return json({ error: "game_id obrigatório." }, 400);
      const { error } = await sb.from("results").delete().eq("game_id", game_id);
      if (error) return json({ error: error.message }, 500);
      return json({ success: true });
    }

    return json({ error: "Ação inválida." }, 400);
  } catch {
    return json({ error: "Erro interno." }, 500);
  }
});

function adminClient() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
  });
}
