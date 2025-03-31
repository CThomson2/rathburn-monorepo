// For admin to create email+password users
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(req: Request) {
  if (req.method !== "POST") {
    return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
  }

  const { email, password, user_metadata } = await req.json();

  try {
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm for internal accounts
      user_metadata: user_metadata,
    });

    if (error) throw error;

    // Add user role if specified
    if (user_metadata?.role) {
      await supabase.from("user_roles").insert({
        user_id: data.user.id,
        role: user_metadata.role,
      });
    }

    return NextResponse.json({ user: data.user }, { status: 200 });
  } catch (error) {
    console.error("Error creating user:", error);
    return NextResponse.json({ error: error }, { status: 500 });
  }
}

// set drum IDs of existing drums in stock to be their original H number IDs
// forget roles for now, just use the authenticated role
// create as many 'simple' data fetching tasks as possible as people will not want to use the supabase ui
// create minimalist dashboard views, with just the essentials items
// other widgets should be added to a separate page, a library of widgets categorized by type/purpose
// update distillation tables and stock / orders with recent data
