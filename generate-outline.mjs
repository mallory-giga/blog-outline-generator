import Anthropic from "@anthropic-ai/sdk";

export default async (req) => {
  const { headline, keyword, cta, context } = await req.json();

  const client = new Anthropic();

  const stream = client.messages.stream({
    model: "claude-sonnet-4-6",
    max_tokens: 2048,
    messages: [{
      role: "user",
      content: `Generate a blog post outline with the following details:
Headline: ${headline}
Keyword: ${keyword}
CTA: ${cta}
Context: ${context || "None provided"}

Format: Introduction → H2 segue with keyword → H3 body sections → H2 conclusion with keyword and CTA. Outline only, no full post.`
    }]
  });

  const encoder = new TextEncoder();
  const readable = new ReadableStream({
    async start(controller) {
      for await (const chunk of stream) {
        if (chunk.type === "content_block_delta" && chunk.delta.type === "text_delta") {
          controller.enqueue(encoder.encode(chunk.delta.text));
        }
      }
      controller.close();
    }
  });

  return new Response(readable, {
    headers: { "Content-Type": "text/plain; charset=utf-8" }
  });
};

export const config = { path: "/api/generate-outline" };
