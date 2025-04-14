"use client";

import Error from "next/error";

export default function GlobalError({
  error,
}: {
  error: Error & { message: string };
}) {
  console.error(error); // This will log to your server console

  return (
    <html>
      <body>
        {process.env.NODE_ENV === "development" ? (
          // Show more details in development
          <div>
            <h1>Something went wrong!</h1>
            <pre>{error.message}</pre>
          </div>
        ) : (
          // Simple user-friendly error in production
          <Error statusCode={500} />
        )}
      </body>
    </html>
  );
}
