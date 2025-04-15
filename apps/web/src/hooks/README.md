# Authentication Hooks

## useAuth

The `useAuth` hook provides a simple interface for handling authentication in the application.

### Usage

```tsx
import { useAuth } from '@/hooks/use-auth';

function ProfileComponent() {
  const { user, loading, signIn, signUp, signOut } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return (
      <div>
        <p>Please sign in to view your profile</p>
        <button onClick={() => signIn('user@example.com', 'password')}>
          Sign In
        </button>
      </div>
    );
  }

  return (
    <div>
      <h1>Welcome, {user.email}</h1>
      <button onClick={signOut}>Sign Out</button>
    </div>
  );
}
```

### Features

- **Real-time Auth State**: Automatically syncs with Supabase authentication state
- **Loading State**: Provides loading state while authentication status is determined
- **Auth Operations**: Simple methods for sign in, sign up, and sign out
- **Automatic UI Refresh**: Refreshes the UI when authentication state changes

### Integration with Server Actions

The hook works well with the server actions defined in `src/app/actions.ts`, which handle form submissions:

```tsx
import { signInAction } from '@/app/actions';

function LoginForm() {
  return (
    <form action={signInAction}>
      <input name="email" type="email" required />
      <input name="password" type="password" required />
      <button type="submit">Sign In</button>
    </form>
  );
}
```

### Auth Subscription

The hook automatically subscribes to authentication state changes, so your UI will update whenever:

- A user signs in
- A user signs out
- Session is refreshed
- User data is updated

It also automatically calls `router.refresh()` to refresh the current page when auth state changes.