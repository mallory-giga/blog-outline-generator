import Anthropic from "@anthropic-ai/sdk";

export const handler = async (event) => {
  try {
    const { headline, keyword, cta, context } = JSON.parse(event.body);

    const client = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    const stream = await client.messages.stream({
      model: "claude-sonnet-4-6",
      max_tokens: 2048,
      messages: [
        {
          role: "user",
          content: `Generate a blog post outline with the following details:

Headline: ${headline}
Keyword: ${keyword}
CTA: ${cta}
Context: ${context || "None provided"}

Format: Introduction → H2 segue with keyword → H3 body sections → H2 conclusion with keyword and CTA. Outline only, no full post.`,
        },
      ],
    });

    let result = "";

    for await (const chunk of stream) {
      if (
        chunk.type === "content_block_delta" &&
        chunk.delta.type === "text_delta"
      ) {
        result += chunk.delta.text;
      }
    }

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "text/plain",
      },
      body: result,
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    };
  }
};
