import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  try {
    const { player_id, pin } = await req.json();

    if (!player_id || pin === undefined || pin === "") {
      return json({ error: "Parâmetros inválidos." }, 400);
    }

    const sb = adminClient();
    const { data, error } = await sb
      .from("players")
      .select("pin")
      .eq("id", player_id)
      .single();

    if (error || !data) return json({ error: "Participante não encontrado." }, 404);
    if (String(data.pin) !== String(pin)) return json({ error: "PIN incorreto." }, 401);

    return json({ valid: true });
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
