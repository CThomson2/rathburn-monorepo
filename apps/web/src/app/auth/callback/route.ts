import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  // The `/auth/callback` route is required for the server-side auth flow implemented
  // by the SSR package. It exchanges an auth code for the user's session.
  // https://supabase.com/docs/guides/auth/server-side/nextjs
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const redirectTo = requestUrl.searchParams.get("redirect_to")?.toString();
  const appSource = requestUrl.searchParams.get("app_source");

  console.log("[AUTH-CALLBACK-WEB] Processing request:", { 
    url: request.url,
    code: code ? "PRESENT" : "MISSING", 
    redirectTo, 
    appSource 
  });

  if (code) {
    const supabase = createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (error) {
      console.error("[AUTH-CALLBACK-WEB] Error exchanging code for session:", error);
      return NextResponse.redirect(`https://rathburn.app/sign-in?error=${encodeURIComponent(error.message)}`);
    }
    
    console.log("[AUTH-CALLBACK-WEB] Session created successfully:", { 
      hasSession: !!data.session,
      userId: data.session?.user?.id || "none" 
    });
  } else {
    console.warn("[AUTH-CALLBACK-WEB] No code provided in callback URL");
  }

  // Determine where to redirect based on app_source
  let baseUrl = "https://rathburn.app";
  if (appSource === "mobile") {
    baseUrl = "https://mobile.rathburn.app";
  }

  console.log("[AUTH-CALLBACK-WEB] Will redirect to base URL:", baseUrl);

  if (redirectTo) {
    // Ensure the redirect path is valid
    const validRedirectPaths = ["/reset-password", "/", "/dashboard", "/orders"];
    const defaultRedirect = "/";

    // Check if the redirectTo path is in our valid paths, otherwise use default
    const isValidPath = validRedirectPaths.some((path) =>
      redirectTo.startsWith(path)
    );
    const finalRedirect = isValidPath ? redirectTo : defaultRedirect;

    const fullRedirectUrl = `${baseUrl}${finalRedirect}`;
    console.log("[AUTH-CALLBACK-WEB] Redirecting to:", fullRedirectUrl);
    return NextResponse.redirect(fullRedirectUrl);
  }

  // Default redirect after sign in/up
  const defaultUrl = `${baseUrl}/`;
  console.log("[AUTH-CALLBACK-WEB] Redirecting to default:", defaultUrl);
  return NextResponse.redirect(defaultUrl);
}
