# Project Feature Workflow MCP-Focused Instructions

## 1. Automatic Activation

These instructions apply automatically to all MCP development workflow chats for the Next.js + Supabase + Shadcn UI project. Utilize the available tools (Sequential Thinking, Memory MCP, Figma MCP, Supabase MCP, etc.) proactively, without requiring explicit user prompts.

## 2. Default Development Workflow

All conversations regarding the project should follow this overall sequence:

1. **Sequential Thinking**

   - Break down multi-step problems or research tasks.
   - Determine which MCP servers (Browser Tools MCP, Supabase MCP, etc.) or tools (REPL, Playwright, etc.) are needed.

2. **UI/UX Component Design and Integration**

   - Utilize 21st-dev/magic MCP and/or Figma MCP for new component design workflows when appropriate.
   - Ensure consistency by synchronizing design updates with final Next.js front-end code.

3. **CRUD Data Flows (Supabase MCP)**

   - Create and manage database schemas, migrations, authentication, and real-time subscriptions via Supabase MCP.
   - Implement and test all CRUD operations in the Next.js App Router.

4. **Memory & Knowledge Graph**

   - Persist design and data schemas across sessions.
   - Store best practices and lessons learned for future reference.

5. **Code Synthesis & Artifacts**

   - Prepare final code artifacts for front-end (Next.js + Shadcn UI) and data integration (Supabase).
   - Include relevant documentation and any longer-form content or visualizations.

6. **Testing and Validation**
   - Test generated code using Browser Tools MCP to analyze browser console logs and runtime behavior.
   - Validate UI component functionality across different states and user interactions.
   - Debug and refine code based on real-time feedback from browser execution.

## 3. Mandatory Tool Usage

- **Sequential Thinking MCP**  
  Must be used for complex or multi-step tasks (e.g., planning data schemas, analyzing dependencies, solving logic puzzles).

- **Brave Search**  
  <write a description, and give use cases for when to use Brave Search>

- **Supabase MCP**  
  Required for all data-layer operations, including CRUD logic, authentication, and real-time event handling.

- **Memory MCP / Knowledge Graph**  
  Store and retrieve important project insights, architectural decisions, or design references. Ensures consistency across conversations.

- **REPL/Analysis**  
  For local data processing or calculations (e.g., analyzing JSON, CSV, or simple transformations). Document all steps taken here.

- **Artifacts**  
  Must be created for any substantial code snippet, complex data structure, or final integrated features. This includes UI components, Next.js route handlers, and Supabase configurations.

- **ShadcnUI Components**
  Mandatory when performing frontend tasks. All UI development must utilize ShadcnUI for consistent design language and accessibility standards.

- **Browser Tools MCP**
  Used for testing and validating frontend code by examining browser console logs, network requests, and runtime behavior. Preferred over Playwright MCP for component-level testing and debugging due to its more detailed console access and DOM inspection capabilities.

## 4. Source Documentation Requirements

- When referencing documentation (Next.js App Router, Supabase, Shadcn UI, etc.), provide the relevant URLs and titles.
- If you rely on search engines or deeper website explorations, cite the full URLs, page titles, and retrieval timestamps.
- Keep a clear record of your search queries for reproducibility.

## 5. Core Workflow Details

### a. Initial Analysis (Sequential Thinking)

1. Identify the main task or question (e.g., "Implement user profile UI with real-time data").
2. Break it into smaller subtasks (e.g., "Design component," "Set up Supabase table," "Integrate in Next.js route").
3. Decide which MCP servers or tools are needed at each step.

### b. UI/UX (ShadcnUI + Design Tools)

1. For new component design workflows, utilize 21st-dev/magic MCP and/or Figma MCP as appropriate.
2. Incorporate ShadcnUI components for all frontend tasks to ensure consistent styling.
3. Synchronize with Next.js front end, ensuring proper routing and layout structure.

### c. Data Handling (Supabase MCP)

1. Define or update database schemas in Supabase (tables, columns, indexes).
2. Configure relevant real-time or authentication hooks.
3. Implement CRUD endpoints in the Next.js App Router.
4. Write integration tests to confirm data flow correctness.

### d. Memory & Knowledge Graph

- Store significant new findings or patterns discovered during development, including design patterns, deployment strategies, or tricky configuration details.
- Retrieve past decisions to avoid duplication of effort.

### e. Synthesis & Presentation (Artifacts)

1. Combine final UI components (ShadcnUI) with the functional CRUD endpoints (Supabase).
2. Generate artifacts for any substantial code or data workflows.
3. Provide structured documentation summarizing your findings, code references, or design changes.

### f. Testing and Validation

1. Use Browser Tools MCP to validate all frontend code through console log inspection and interactive testing.
2. Analyze runtime errors, component state, and network interactions through the browser console.
3. Ensure responsive behavior and proper rendering across different viewport sizes.
4. Debug and refine implementation based on observed behavior in the browser environment.

## 6. Implementation Notes

- Always default to **Sequential Thinking** whenever a multi-step or uncertain task arises.
- Use design tools (Figma MCP or 21st-dev/magic MCP) when appropriate for component design workflows.
- Integrate **Supabase MCP** for all database needs, from schema design to real-time subscriptions.
- Keep an updated record of changes in **Memory MCP** or the Knowledge Graph for future reference.
- Reference official docs for Next.js App Router, Supabase, and Shadcn UI, ensuring that all integration steps follow recommended best practices.
- Output final or intermediate results as **Artifacts** for version control or stakeholder review.
- Validate all frontend implementations using **Browser Tools MCP** for real-time testing and debugging.

---

This consolidated instruction set ensures your primary MCP servers (Figma MCP and Supabase MCP) are fully integrated into the default workflow and emphasizes the Next.js + Shadcn UI front-end approach you’re focusing on. Feel free to adjust further if you have additional MCP servers or specialized needs.
