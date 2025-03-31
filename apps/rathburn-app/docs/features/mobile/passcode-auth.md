# Mobile Passcode Login API Route

```ts
import { createClient } from "@supabase/supabase-js";

// Initialize with service_role key to bypass RLS
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { passcode } = req.body;

    if (!passcode || passcode.length !== 4) {
      return res.status(400).json({ error: "Invalid passcode format" });
    }

    // Query the worker_passcodes table to find a matching passcode
    const { data: passcodeData, error: passcodeError } = await supabase
      .from("worker_passcodes")
      .select("user_id, worker_name, role")
      .eq("passcode", passcode)
      .single();

    if (passcodeError || !passcodeData) {
      return res.status(401).json({ error: "Invalid passcode" });
    }

    // Get user details associated with this passcode
    const { data: userData, error: userError } =
      await supabase.auth.admin.getUserById(passcodeData.user_id);

    if (userError) {
      return res.status(500).json({ error: "Error retrieving user" });
    }

    // Create a short-lived session (10 minutes)
    const { data: sessionData, error: sessionError } =
      await supabase.auth.admin.createSession({
        user_id: passcodeData.user_id,
        expires_in: 600, // 10 minutes in seconds
      });

    if (sessionError) {
      return res.status(500).json({ error: "Error creating session" });
    }

    // Log this login event
    await supabase.from("auth_activity_log").insert({
      user_id: passcodeData.user_id,
      action: "mobile_login",
      metadata: {
        device_type: req.headers["user-agent"],
        worker_name: passcodeData.worker_name,
      },
    });

    // Return session data and set cookies
    const { access_token, refresh_token } = sessionData.session;

    // Set cookies with short expiry for mobile
    res.setHeader("Set-Cookie", [
      `sb-access-token=${access_token}; Path=/; HttpOnly; Max-Age=600`,
      `sb-refresh-token=${refresh_token}; Path=/; HttpOnly; Max-Age=600`,
    ]);

    return res.status(200).json({
      user: {
        ...userData.user,
        worker_name: passcodeData.worker_name,
        role: passcodeData.role,
      },
    });
  } catch (error) {
    console.error("Passcode login error:", error);
    return res.status(500).json({ error: "An unexpected error occurred" });
  }
}
```
