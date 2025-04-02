import { Anthropic } from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  // defaults to process.env["ANTHROPIC_API_KEY"]
  apiKey: process.env.ANTHROPIC_API_KEY || "",
});

// Replace placeholders like {{CODEBASE}} with real values,
// because the SDK does not support variables.
const msg = await anthropic.messages.create({
  model: "claude-3-7-sonnet-20250219",
  max_tokens: 20000,
  temperature: 1,
  messages: [
    {
      role: "user",
      content: [
        {
          type: "text",
          text: 'You are tasked with reviewing a large NextJS codebase and creating a new index page. Follow these instructions carefully:\n\n1. Review the codebase:\n<codebase>\n{{CODEBASE}}\n</codebase>\n\nAnalyze the structure, components, and functionality of the NextJS project. Pay close attention to the routing system, existing pages, and any shared components or utilities.\n\n2. Create a summary of the project:\n- Describe the overall purpose and main features of the application\n- Outline the key technologies and libraries used\n- Explain the project structure and organization\n\n3. Identify problems, errors, and inefficiencies:\n- Look for any syntax errors or logical issues in the code\n- Identify areas of redundancy or repeated code that could be refactored\n- Highlight instances of client-side rendering where server-side rendering would be more appropriate\n- Note any performance issues or potential bottlenecks\n\n4. Create a new page.tsx:\n- Design an index page to be placed at the top level ("https://rathburn.app:3000/")\n- Implement a grid structure of large card components, each representing a link to different pages in the app\n- Each card should include:\n  - A caption describing the linked page\n  - A placeholder preview of the page content\n  - A routing component to navigate to the respective page\n- Ensure the design is visually appealing and consistent with the existing app style\n\n5. Output your response in the following format:\n<project_summary>\n[Your summary of the project]\n</project_summary>\n\n<issues_and_inefficiencies>\n[List of identified problems, errors, and inefficiencies]\n</issues_and_inefficiencies>\n\n<new_page_code>\n[The complete code for the new page.tsx file]\n</new_page_code>\n\n<explanation>\n[A brief explanation of your design choices and how the new page integrates with the existing codebase]\n</explanation>\n\nYour final output should only include the content within these tags. Do not include any additional commentary or notes outside of these sections.',
        },
      ],
    },
  ],
});
console.log(msg);
