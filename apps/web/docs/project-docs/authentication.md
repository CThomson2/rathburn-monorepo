# Authentication Feature Overview

## Relevant Code

### Front End

app/auth/ // Authentication pages and components
├── \_components // Authentication components
│ └── auth-layout.tsx // Defines the layout for the auth pagesusers
├── layout.tsx  
├── login/
│ └── page.tsx // Login page (immediate redirect upon loading app "/")
├── register
│ └── page.tsx // Registration page
└── route.ts // Redirects from nonexistent '/auth/' route to the login page

**UI Components**

- `components/ui/form/switch.tsx` - Custom switch component
- `components/ui/spinner/spinner.tsx` - Loading spinner
- `components/protected-route.tsx` - Component for client-side route protection

**Config**

- `config/paths.ts` - Defines the paths for the authentication feature
- `types/api/auth.ts` - Defines the API types for the authentication and user management features

## API Routes

- GET `api/auth/me` - Returns the current user
- POST `api/auth/login` with request body `{ email, password }` - Logs in a user with email and password
- POST `api/auth/register` with request body `{ email, firstName, lastName, password, confirmPassword, role: "USER" }` - Registers a user with email and password
- POST `api/auth/logout` - Logs out the current user

### **Custom Hooks & Authentication Logic**

- `lib/auth.tsx` - Handles the authentication logic with hooks and defines validation schemas

  - `useUser` - Hook for fetching the current user
  - `useLogin` - Hook for logging in a user
  - `useRegister` - Hook for registering a user
  - `useLogout` - Hook for logging out a user
  - `loginWithEmailAndPassword` - Function for logging in a user with email and password
  - `registerWithEmailAndPassword` - Function for registering a user with email and password

_React Query is used here to manage server state efficiently:_

1. **Data Fetching**: useUser() hook uses React Query to fetch and cache the current user data
2. **Automatic Caching**: The user data is cached with the userQueryKey for reuse across components
3. **Mutations for State Changes**:
   - useLogin() - Handles login API calls and updates the cache with user data
   - useRegister() - Handles registration API calls and updates the cache
   - useLogout() - Handles logout and clears the user data from cache

The main benefits are:

- Centralized data management
- Automatic caching and invalidation
- Consistent loading/error states
- Optimistic UI updates (setting query data immediately after mutations)

This approach separates data fetching logic from UI components, making the code more maintainable.

### Utility Functions

- `utils/auth.ts` - Methods for:
  - fetching authentication token from cookies `getAuthTokenCookie()`
  - checking if user is logged in `checkLoggedIn()`

## How Authentication Works in This Application

### 1. Authentication Flow Overview

The authentication system in this application follows these steps:

1. **User Registration**: New users create an account by providing personal information
2. **Login**: Users authenticate using their email and password
3. **Session Management**: After successful authentication, a JWT token is stored in a secure HTTP-only cookie
4. **Access Control**: Protected routes check for a valid token before allowing access
5. **Logout**: The auth cookie is cleared to end the user session

### 2. JWT-Based Authentication

This application uses JWT (JSON Web Tokens) for authentication:

#### What is JWT?

A JWT is a compact, URL-safe token format that contains encoded JSON data. Each JWT consists of three parts:

- **Header**: Contains the token type and signing algorithm
- **Payload**: Contains claims (user ID, role, expiration time, etc.)
- **Signature**: Used to verify the token hasn't been tampered with

#### How JWTs are Used in this App:

1. **Token Generation**: When a user logs in or registers, the server:

   - Validates credentials
   - Creates a JWT containing the user's ID and role
   - Signs the token using a secret key
   - Sets the token as an HTTP-only cookie

2. **Token Validation**: On subsequent requests:
   - The JWT cookie is automatically sent with requests
   - The server validates the token signature
   - If valid, the user's identity and permissions are extracted

### 3. Cookie Security

Our authentication system uses cookies with specific security settings:

```typescript
cookieStore.set({
  name: AUTH_TOKEN_COOKIE_NAME,
  value: token,
  httpOnly: true, // Prevents JavaScript access (XSS protection)
  secure: true, // Only sent over HTTPS
  sameSite: "strict", // Prevents CSRF attacks
  maxAge: 60 * 60 * 24 * 7, // 1 week expiration
  path: "/", // Available across the entire site
});
```

These settings provide several security benefits:

- **HttpOnly**: Prevents client-side JavaScript from accessing cookies, protecting against XSS attacks
- **Secure**: Ensures the cookie is only sent over HTTPS, preventing man-in-the-middle attacks
- **SameSite**: Controls when cookies are sent with cross-site requests, mitigating CSRF vulnerabilities

### 4. Authentication State Management

The application manages auth state using React Query:

1. **Initial Load**:

   - When the app starts, `useUser()` hook makes a request to `/api/auth/me`
   - If a valid cookie exists, the server returns the user profile
   - React Query caches this user data

2. **State Synchronization**:

   - The cached user data is available to all components
   - Login/register mutations update the cache
   - Logout removes the data from cache

3. **Client-side Access Control**:
   - Components can check authentication state using `const { data: user } = useUser()`
   - The ProtectedRoute component prevents access to protected pages
   - UI elements can be conditionally rendered based on auth state

### 5. Route Protection

The application uses two layers of protection:

1. **Server-side Middleware**:

   - `middleware.ts` intercepts requests to protected routes
   - Checks for a valid auth cookie
   - Redirects unauthenticated users to the login page

2. **Client-side Protection**:
   - `ProtectedRoute` component checks auth state
   - Supports role-based access control
   - Shows loading states during auth checks
   - Preserves the original URL for post-login redirection

Example usage:

```tsx
// Admin-only page
export default function AdminPage() {
  return (
    <ProtectedRoute allowedRoles={["ADMIN"]}>
      <AdminDashboard />
    </ProtectedRoute>
  );
}
```

### 6. Session Lifecycle

1. **Session Creation**:

   - User logs in or registers
   - Server validates credentials
   - JWT token is generated and stored as a cookie
   - User data is cached on the client

2. **Session Maintenance**:

   - JWT includes an expiration time (7 days by default)
   - As long as the token is valid, the user remains authenticated
   - Each protected request validates the token on the server

3. **Session Termination**:
   - User clicks logout
   - `/api/auth/logout` endpoint clears the auth cookie
   - React Query cache is invalidated
   - User is redirected to the login page

### 7. Password Security

For a production environment, the application should implement these password security measures:

1. **Password Storage**:

   - Passwords are never stored in plain text
   - Passwords are hashed using bcrypt with a suitable work factor
   - Each password has a unique salt to prevent rainbow table attacks

2. **Password Requirements**:
   - Minimum length of 8 characters
   - Must contain uppercase and lowercase letters
   - Must contain at least one number
   - Validated on both client and server

### 8. Common Authentication Vulnerabilities and Mitigations

This application includes protections against common authentication vulnerabilities:

1. **Cross-Site Scripting (XSS)**:

   - HttpOnly cookies prevent token theft via JavaScript
   - Content Security Policy headers restrict script execution

2. **Cross-Site Request Forgery (CSRF)**:

   - SameSite cookie policy prevents cross-origin requests
   - State-changing operations require POST requests

3. **Session Hijacking**:

   - Secure and HttpOnly cookies
   - HTTPS-only communication
   - JWT signature validation

4. **Brute Force Attacks**:
   - Rate limiting on authentication endpoints
   - Account lockout after multiple failed attempts

## Testing Authentication

You can test the authentication system using these credentials:

- Email: `demo@example.com`
- Password: `password123`

During development, the authentication system uses mock data. In production, replace the mocks with actual database queries and JWT implementation.
