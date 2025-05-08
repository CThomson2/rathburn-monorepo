# Vite PWA Project Structure

## Feature-Based Structure

```txt
src/
  ├── core/                      # App-wide core functionality
  │   ├── components/            # Shared UI components
  │   │   ├── layout/            # Layout components
  │   │   ├── feedback/          # Toast, loaders, etc.
  │   │   └── ui/                # Buttons, cards, etc.
  │   ├── hooks/                 # Shared hooks
  │   ├── services/              # API clients, storage
  │   │   ├── api.ts             # Base API client (client-side)
  │   │   ├── storage.ts         # Local storage
  │   │   └── supabase.ts        # Supabase client
  │   ├── types/                 # Shared types
  │   └── utils/                 # Utilities and helpers
  │
  ├── features/                  # Feature modules
  │   │
  │   ├── scanner/               # Barcode scanning functionality
  │   │   ├── components/        # Scanner UI components
  │   │   │   ├── ScanButton.tsx
  │   │   │   ├── ScanFeedback.tsx
  │   │   │   └── ScanHeader.tsx
  │   │   ├── hooks/             # Scanner-specific hooks
  │   │   │   ├── useScanner.ts  # Main scanning logic
  │   │   │   └── useScanHistory.ts
  │   │   ├── services/          # Scanner-specific API calls
  │   │   │   └── scannerService.ts
  │   │   ├── types/             # Scanner-specific types
  │   │   │   └── scanner.types.ts
  │   │   ├── utils/             # Scanner-specific helpers
  │   │   │   └── barcodeParser.ts
  │   │   └── index.ts           # Public API for this feature
  │   │
  │   ├── session/               # Session management
  │   │   ├── components/
  │   │   │   ├── SessionBanner.tsx
  │   │   │   └── SessionControls.tsx
  │   │   ├── hooks/
  │   │   │   ├── useSession.ts  # Create, end, manage sessions
  │   │   │   └── useSessionStorage.ts
  │   │   ├── services/
  │   │   │   └── sessionService.ts
  │   │   ├── types/
  │   │   │   └── session.types.ts
  │   │   ├── context/
  │   │   │   └── SessionContext.tsx
  │   │   └── index.ts
  │   │
  │   ├── location/              # Location/zone management
  │   │   ├── components/
  │   │   │   ├── ZoneSelector.tsx
  │   │   │   └── CurrentZoneBanner.tsx
  │   │   ├── hooks/
  │   │   │   └── useZone.ts
  │   │   ├── services/
  │   │   │   └── locationService.ts
  │   │   ├── types/
  │   │   │   └── location.types.ts
  │   │   └── index.ts
  │   │
  │   ├── user/                  # User profile and gamification
  │   │   ├── components/
  │   │   ├── hooks/
  │   │   │   ├── useProfile.ts
  │   │   │   └── useUserStats.ts
  │   │   ├── services/
  │   │   │   └── userService.ts
  │   │   ├── types/
  │   │   └── index.ts
  │   │
  │   └── task/                  # Task management
  │       ├── components/
  │       ├── hooks/
  │       ├── services/
  │       ├── types/
  │       └── index.ts
  │
  ├── pages/                     # Top-level page components
  │   ├── HomePage.tsx
  │   ├── ScanPage.tsx
  │   ├── ProfilePage.tsx
  │   └── TaskListPage.tsx
  │
  ├── App.tsx                    # Main app component
  ├── main.tsx                   # Entry point
  └── vite-env.d.ts              # Type declarations
```
