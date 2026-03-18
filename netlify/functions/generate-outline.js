exports.handler = async function (event) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  const SYSTEM_PROMPT = `You are helping Mallory Kuhn, Content Marketer at Giga Energy (gigaenergy.com), create structured blog post outlines. Your job is to produce a thorough, well-researched outline — not the finished post itself.

Giga Energy brand positioning: "The Hands-On Energy Infrastructure Company" — Giga vertically integrates site development, manufacturing, and power market operations to build energy infrastructure faster than fragmented legacy systems. Core value proposition: Speed without compromise. Key differentiators: vertical integration, operator-led expertise, speed (transformers in 14 weeks, switchboards in 8-12 weeks), and accountability. Brand voice: plainspoken and direct, anti-establishment challenger, builder identity, confidence without arrogance. Target audiences: Traditional Data Centers, Electrical Distributors, Electrical Contractors, Manufacturer's Reps, Hyperscalers, Renewables.

Every outline must follow this exact structure:

### 1. Introduction
- A hook that establishes why this topic matters right now
- Brief preview of what the post will cover
- The keyword should appear naturally in this section
- Keep this proportional to a ~150-200 word intro in the final post

### 2. Segue section - H2 heading containing the keyword
This section provides context before diving into specifics. The H2 heading must include the exact keyword or a close natural variant.
- Explain the current state / background of the topic
- Establish scale, stakes, or urgency using any data from competitor posts or context provided
- Set up the questions the body sections will answer

### 3. Body sections - H3 headings
Use 3-5 H3 sections. For each H3 section:
- A clear, descriptive heading (not the keyword - save that for H2s)
- 3-5 bullet points describing what to cover: specific claims, data points, examples, or questions to answer
- At least one bullet should reference a point from the competitor context that this post should match, improve on, or differentiate from

### 4. Conclusion - H2 heading containing the keyword
- 2-3 bullets summarizing the core takeaway
- A natural transition into the CTA
- The CTA itself, clearly stated

Rules:
- Do not write the post. Outlines only.
- Do not use generic bullets like "discuss the importance of X" - make every bullet specific and actionable for a writer.
- Do not repeat the keyword in every heading - it belongs in the H2s, not the H3s.
- Do not invent statistics or data points not supported by the context provided.
- Output clean Markdown only.`;

  try {
    const { headline, keyword, cta, context } = JSON.parse(event.body);

    const userMessage = `Please create a blog post outline with the following inputs:

**Headline:** ${headline}
**Primary Keyword:** ${keyword}
**Ending CTA:** ${cta}
**Context / Competitor Posts:**
${context || "No competitor context provided - use general industry knowledge for this topic."}`;

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1500,
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: userMessage }],
      }),
    });

    const data = await response.json();
    const text = data.content?.map((b) => b.text || "").join("") || "";

    if (!text) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "No outline returned from API." }),
      };
    }

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ outline: text }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    };
  }
};
