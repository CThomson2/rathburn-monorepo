# Configuring CORS

### **Your Setup**

- You have **two apps in a monorepo**:
  - A **Next.js (App Router) web app** serving API route handlers.
  - A **Vite-based mobile app** (used on barcode scanner devices).
- In **development**, these run on **different `localhost` ports**.
- In **production**, they’ll be on:
  - `https://mycompany.app` (Next.js Web App + API Routes)
  - `https://mobile.mycompany.app` (Mobile App)

In development, it might be:

- `http://localhost:3000` (Next.js App)
- `http://localhost:8080` (Vite App)

So from the browser’s point of view, these are **different origins**, even though they’re both `localhost`.

---

### **Why You Get a CORS Error**

The browser blocks requests from one origin (like `localhost:8080`) to another (`localhost:3000`) **unless the server explicitly allows it** via CORS headers.

When your mobile app calls the Next.js API, it triggers **a preflight request** (an `OPTIONS` HTTP request) if:

- It’s a `POST`, `PUT`, or `DELETE` request
- It sends custom headers
- The content type is anything other than `application/x-www-form-urlencoded`, `multipart/form-data`, or `text/plain`

If your Next.js API doesn’t handle that preflight properly and doesn’t send the right CORS headers, the browser blocks the request.

---

### **How to Fix It (in Next.js App Router)**

You’re using **App Router** with **Route Handlers**, not the older `pages/api` setup. You need to set up **CORS manually** in your handlers.

Here's how you can do it properly:

#### 1. **Install the `nextjs-cors` package (optional helper)**

```bash
npm install nextjs-cors
```

#### 2. **Your API route (e.g., `app/api/logs/drum-scan/route.ts`)**

```ts
// app/api/logs/drum-scan/route.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import nextCors from "nextjs-cors";

export async function OPTIONS(request: NextRequest) {
  await nextCors(request, NextResponse.next(), {
    methods: ["GET", "POST", "OPTIONS"],
    origin: ["http://localhost:8080"], // development
    // origin: ['https://mobile.mycompany.app'], // production
    credentials: true,
  });
  return NextResponse.json({}, { status: 200 });
}

export async function POST(request: NextRequest) {
  await nextCors(request, NextResponse.next(), {
    methods: ["GET", "POST", "OPTIONS"],
    origin: ["http://localhost:8080"], // development
    // origin: ['https://mobile.mycompany.app'], // production
    credentials: true,
  });

  const body = await request.json();
  console.log("Drum scanned:", body);

  return NextResponse.json({ message: "Scan received" });
}
```

You must handle the `OPTIONS` request **separately** for CORS to work, or the preflight will fail.

---

### **Alternative: Manually Set Headers**

If you don’t want to use a package:

```ts
function setCorsHeaders(response: NextResponse) {
  response.headers.set("Access-Control-Allow-Origin", "http://localhost:8080");
  response.headers.set("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  response.headers.set("Access-Control-Allow-Headers", "Content-Type");
  response.headers.set("Access-Control-Allow-Credentials", "true");
  return response;
}

export async function OPTIONS() {
  return setCorsHeaders(new NextResponse(null, { status: 204 }));
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const response = NextResponse.json({ message: "Scan received" });
  return setCorsHeaders(response);
}
```

---

### **Things to Check**

1. **Use full origin in development**:

   - Make sure the port matches exactly (`http://localhost:8080` is not the same as `http://localhost:3000`).

2. **Don’t use wildcard (`*`) for `Access-Control-Allow-Origin` if you’re using `credentials: true`**

3. **Enable credentials in the `fetch()` request** from the Vite app:

```ts
await fetch("http://localhost:3000/api/logs/drum-scan", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  credentials: "include", // Needed if your server sends cookies, etc.
  body: JSON.stringify({ scannedData }),
});
```

---

### **In Production**

- Replace `http://localhost:8080` with `https://mobile.rathburn.app`
- Consider putting the allowed origin(s) in an `ENV` variable so it's easier to switch depending on `process.env.NODE_ENV`
