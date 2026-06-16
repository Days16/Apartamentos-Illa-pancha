import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders } from "../_shared/cors.ts";

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  // Verificar que el llamante es admin
  const jwt = req.headers.get("authorization")?.replace("Bearer ", "");
  if (!jwt) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });

  const anonClient = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: `Bearer ${jwt}` } } }
  );
  const { data: { user }, error: authErr } = await anonClient.auth.getUser();
  if (authErr || !user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });

  const role = user.app_metadata?.role;
  if (role !== "admin") return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: corsHeaders });

  // Cliente con service role para operar sobre auth.users
  const adminClient = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  try {
    if (req.method === "GET") {
      // Listar usuarios
      const { data, error } = await adminClient.auth.admin.listUsers();
      if (error) throw error;
      const users = data.users.map(u => ({
        id: u.id,
        email: u.email,
        role: u.app_metadata?.role ?? null,
        portal_sections: u.app_metadata?.portal_sections ?? null,
        created_at: u.created_at,
        last_sign_in_at: u.last_sign_in_at,
        banned_until: u.banned_until ?? null,
      }));
      return new Response(JSON.stringify({ users }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (req.method === "POST") {
      const { email, role: newRole, password } = await req.json();
      if (!email || !newRole) return new Response(JSON.stringify({ error: "email and role required" }), { status: 400, headers: corsHeaders });

      if (password) {
        // Crear usuario con contraseña directa (sin email de invitación)
        const { data, error } = await adminClient.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          app_metadata: { role: newRole },
        });
        if (error) throw error;
        return new Response(JSON.stringify({ ok: true, id: data.user.id }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      } else {
        // Flujo de invitación por email (comportamiento original)
        const { data, error } = await adminClient.auth.admin.inviteUserByEmail(email, {
          data: { role: newRole },
        });
        if (error) throw error;
        await adminClient.auth.admin.updateUserById(data.user.id, {
          app_metadata: { role: newRole },
        });
        return new Response(JSON.stringify({ ok: true, id: data.user.id }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
    }

    if (req.method === "PATCH") {
      // Actualizar rol, secciones del portal o estado de un usuario
      const { id, role: newRole, active, portal_sections } = await req.json();
      if (!id) return new Response(JSON.stringify({ error: "id required" }), { status: 400, headers: corsHeaders });

      if (newRole !== undefined || portal_sections !== undefined) {
        // Obtener metadata actual para hacer merge (no reemplazar)
        const { data: currentUserData } = await adminClient.auth.admin.getUserById(id);
        const currentMeta: Record<string, unknown> = currentUserData?.user?.app_metadata ?? {};
        const updates: Record<string, unknown> = { ...currentMeta };
        if (newRole !== undefined) updates.role = newRole;
        if (portal_sections !== undefined) updates.portal_sections = portal_sections;
        await adminClient.auth.admin.updateUserById(id, { app_metadata: updates });
      }
      if (active === false) {
        await adminClient.auth.admin.updateUserById(id, { ban_duration: "876600h" });
      }
      if (active === true) {
        await adminClient.auth.admin.updateUserById(id, { ban_duration: "none" });
      }
      return new Response(JSON.stringify({ ok: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405, headers: corsHeaders });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders });
  }
});
