# Issue 33 - Spreadsheet UI & Modular Query Builder

## Claude AI Agent Prompt

> Anthropic API 

**Prompt:**

You are tasked with developing a user-friendly query builder page for an inventory management app built using Next.js and Supabase. This internal tool is intended for non-technical users (who typically use Excel spreadsheets) to interact with a database via common CRUD operations (primarily create, read, update—with delete only in very narrow circumstances). The key objectives are to abstract away SQL complexity while providing enough flexibility to perform operations like filtering, sorting, and even joining related tables. The following specifications outline the required functionality:

1. **User Interface and Workflow:**
   - **Step-by-Step Flow:**  
     Design a wizard-style or progressive form interface that guides users through each step, starting with selecting a table or view.
   - **Table/View Selection:**  
     Provide a dropdown list for users to select from a curated list of tables/views (e.g., “Raw Materials”, “Stock”) that are relevant to their tasks.
   - **Operation Selection:**  
     Include options for CRUD operations (select/read, insert/create, update) on the chosen table. Note that deletion is only available in exceptional cases.
   - **Dynamic Joins:**  
     Allow users to optionally add a related table for joining. Once a table is selected for a join, display additional dropdowns or options to specify join conditions based on foreign keys or predefined relationships.
   - **Filtering and Sorting:**  
     Enable users to build query conditions without SQL syntax. For example, allow them to choose columns, select conditions (e.g., equals, contains), and specify sort order through intuitive controls.

2. **Backend Integration and Security:**
   - **Server Actions:**  
     Use Next.js server actions (or API routes) to handle form submissions securely. The backend should validate the query parameters and build the corresponding SQL (or utilize Supabase’s query API) to execute the request.
   - **Row-Level Security:**  
     Ensure that all queries respect Supabase’s row-level security policies. Validate user permissions on the server side before executing any operations.
   - **Predefined Views vs. Dynamic Queries:**  
     Consider using predefined views for common operations to simplify the interface. However, the design should also support more dynamic query building (e.g., joins) as needed.

3. **Error Handling and Feedback:**
   - Provide clear, user-friendly error messages and real-time validation where possible. If a query fails due to security or validation issues, display an understandable message rather than a raw error.

4. **Coding Standards and Documentation:**
   - Write clean, modular code that adheres to conventional coding standards. Use React components for the frontend and maintain clear separation between UI logic and backend processing.
   - Comment the code thoroughly and include brief explanations of your implementation choices and the rationale behind key design decisions.

5. **Deliverables:**
   - Create a Next.js page component that serves as the query builder interface.
   - Develop any necessary React components for form controls, dropdowns, and dynamic sections.
   - Implement server actions (or API routes) that receive the form data, perform input validation, enforce security policies, and execute the queries against Supabase.
   - Provide a brief summary explaining the overall structure, component hierarchy, and the integration with Supabase.

Please produce the complete code for this feature along with an explanation of how each part works and how it meets the above requirements.

---

This prompt will be used to instruct the AI agent to generate the necessary code and documentation for the query builder feature.