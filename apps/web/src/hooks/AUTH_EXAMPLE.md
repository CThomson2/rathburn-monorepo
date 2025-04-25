# Supabase Auth Integration Examples

This document provides examples of how to use the authentication system in different parts of your application.

## 1. Using Auth in a Component

```tsx
"use client";

import { useAuthContext } from "@/components/desktop/layout/auth/auth-context";
import { Button } from "@/components/ui/button";

export function UserProfileButton() {
  const { user, loading, signOut } = useAuthContext();

  if (loading) {
    return <Button disabled>Loading...</Button>;
  }

  if (!user) {
    return <Button variant="outline">Sign In</Button>;
  }

  return (
    <div className="flex items-center gap-2">
      <div>
        <div className="font-medium">{user.email}</div>
        <div className="text-xs text-muted-foreground">Logged in</div>
      </div>
      <Button variant="ghost" size="sm" onClick={signOut}>
        Sign Out
      </Button>
    </div>
  );
}
```

## 2. Using Auth Subscription

The auth subscription is automatically handled by the `useAuth` hook. When auth state changes:

1. The user state is updated
2. The loading state is updated
3. `router.refresh()` is called to refresh the page

```tsx
// This is handled inside useAuth hook
useEffect(() => {
  // Subscribe to auth state changes
  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange((_event, session) => {
    setUser(session?.user ?? null);
    setLoading(false);
    router.refresh(); // This refreshes the current page
  });

  return () => {
    subscription.unsubscribe();
  };
}, [router]);
```

## 3. Using Auth with Server Actions

The server actions in `src/app/actions.ts` are designed to be used with forms:

```tsx
"use client";

import { signInAction } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function LoginForm() {
  return (
    <form action={signInAction} className="space-y-4">
      <div>
        <label htmlFor="email">Email</label>
        <Input id="email" name="email" type="email" required />
      </div>
      <div>
        <label htmlFor="password">Password</label>
        <Input id="password" name="password" type="password" required />
      </div>
      <Button type="submit">Sign In</Button>
    </form>
  );
}
```

## 4. Protected Routes with Server-Side Auth

For routes that should be protected:

```tsx
// src/app/(routes)/protected/layout.tsx
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();
  const { data } = await supabase.auth.getSession();

  if (!data.session) {
    // Redirect to login if not authenticated
    redirect("/sign-in");
  }

  return <div>{children}</div>;
}
```

## 5. Accessing User in API Routes

```tsx
// src/app/api/user-data/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Fetch user-specific data
  const { data, error } = await supabase
    .from("user_profiles")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}
```

## 6. Combining with React Query

You can combine auth with React Query for data fetching:

```tsx
"use client";

import { useAuthContext } from "@/components/desktop/layout/auth/auth-context";
import { useQuery } from "@tanstack/react-query";

// Function that fetches data and includes auth token
const fetchUserData = async (userId: string) => {
  const response = await fetch(`/api/user-data/${userId}`);
  if (!response.ok) throw new Error("Failed to fetch user data");
  return response.json();
};

export function UserProfile() {
  const { user, loading } = useAuthContext();

  const { data, isLoading, error } = useQuery({
    queryKey: ["userData", user?.id],
    queryFn: () => fetchUserData(user!.id),
    // Only run query if user is authenticated
    enabled: !!user,
  });

  if (loading || isLoading) return <div>Loading...</div>;
  if (error) return <div>Error loading profile</div>;
  if (!user) return <div>Please sign in</div>;

  return (
    <div>
      <h1>User Profile</h1>
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </div>
  );
}
```
