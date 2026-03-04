import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export async function GET() {
  try {
    const supabase = getSupabaseAdmin();

    const { data, error } = await supabase.from("tags").select("id, name").order("name");

    if (error) {
      return jsonError("Failed to load tags.", 500);
    }

    return NextResponse.json({ tags: data ?? [] });
  } catch {
    return jsonError(
      "Supabase configuration is missing. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.",
      500,
    );
  }
}

export async function POST(request: Request) {
  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return jsonError("Invalid JSON body.");
  }

  const input = payload as { name?: unknown };
  const name = typeof input.name === "string" ? input.name.trim().toLowerCase() : "";

  if (!name) {
    return jsonError("Tag name is required.");
  }

  try {
    const supabase = getSupabaseAdmin();

    const { data, error } = await supabase
      .from("tags")
      .insert({ name })
      .select("id, name")
      .single();

    if (error?.code === "23505") {
      const { data: existingTag, error: existingTagError } = await supabase
        .from("tags")
        .select("id, name")
        .eq("name", name)
        .single();

      if (existingTagError || !existingTag) {
        return jsonError("Failed to save tag.", 500);
      }

      return NextResponse.json({ tag: existingTag, duplicate: true });
    }

    if (error || !data) {
      return jsonError("Failed to save tag.", 500);
    }

    return NextResponse.json({ tag: data }, { status: 201 });
  } catch {
    return jsonError("Failed to save tag.", 500);
  }
}
