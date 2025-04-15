```ts
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  // defaults to process.env["ANTHROPIC_API_KEY"]
  apiKey: "my_api_key",
});

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
          text: 'I want you to help me make a new API route, similar to the one at the API endpoint of "api/barcodes/stock-drums/[order-detail-id]", but with slightly different params and more enhanced.\n\nImportantly, this new API route should also create PDF labels with the exact same layout and content and structure as the server-side PDF generation code I linked does.\n\nThe existing API route creates the PDF labels based on user form data, and creates a batch of labels with incrementing `drumId` values using the input of an `order_detail_id`. You can see that it also uses Prisma ORM. For the new route.ts, it must use Supabase (not an ORM).\n\nThe supabase connection for server or client is in these config files, and is functioning well (no changes needed to these files): @server.ts @client.ts @supabase.ts (in "src/lib/supabase") .\n\n\nStart creating the new API route in the "src/app/api/" directory. I\'ve written some documentation comments in the file we\'ll use ("api/barcodes/initial-stock/route.ts") to outline the purpose of the code, and I have included the table schema.\n\nSo let\'s give this a shot. Write some code to pull the data from the `drums` table from Supabase and prepare it for processing. Then under the second long doc comment, create the PDF following the PDF design details in the comment (or referencing the previuosly mentioend existing PDF label generation API route if that\'s easier (to just copy over the pdf configuration code). Thanks',
        },
      ],
    },
  ],
});
console.log(msg);
```
