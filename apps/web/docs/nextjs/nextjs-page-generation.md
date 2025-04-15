# Next.js Page Generation

Next.js provides several strategies for generating pages:

1. **Static Generation**:

   - Pages are generated at build time
   - Data is fetched at build time
   - Content is cached in the browser
   - Suitable for content-heavy pages with infrequent updates

2. **Server-Side Rendering (SSR)**:

   - Pages are generated on each request
   - Data is fetched on each request
   - Content is not cached in the browser
   - Suitable for dynamic content with frequent updates

3. **Incremental Static Regeneration (ISR)**:

   - Similar to SSR, except with revalidation
   - Pages are generated at build time, but can be updated after build at set intervals
   - Suitable for content that changes frequently

4. **Dynamic Rendering**:

   - Pages are generated on each client request
   - Server does minimal work, just enough to render the page
   - Data is fetched on each request via React hooks and other client-side APIs
   - Content can be cached in the browser

## Inventory Management Dashboard & CRUD Application

### General Pattern

Components are rendered inside their parent server components, which aggregate all sub-components into their respective /app/ folder, then fetch initial data from the server-side to pass as a prop to the client components.

### Why This Pattern?

- **Performance**:

  - SSR ensures the page is rendered on the server, providing a fast initial load experience
  - Client components handle dynamic interactions, providing a smooth user experience
  - Data is cached in the browser, providing a fast experience on subsequent loads

- **Application for Private Business Inventory Management App Use Case**

  - SEO is of no importance
  - The IP is private, and limited to the range of the company's IP
  - The app is highly dynamic, and the data is updated frequently
  - The app is not used by a wide audience, and is not expected to grow
  - Most pages implement various CRUD operations via API routes, requiring dynamic SQL read-write operations

This is a common and effective pattern. By making the top-level page components server components, server-side rendering (SSR) is performed to fetch initial data on each page load, ensuring the data is always up-to-date. This pattern allows for passing the initial data to client components, which handle further client-side interactions and state management using client-side APIs. This approach combines the benefits of SSR for initial data fetching with client-side rendering for dynamic interactions. It fetches data every time the page loads, not just at build time, ensuring fresh data on each request.
