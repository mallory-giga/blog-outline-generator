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
- Explain the current state / background of the topic
- Establish scale, stakes, or urgency
- Set up the questions the body sections will answer

### 3. Body sections - H3 headings
Use 3-5 H3 sections each with 3-5 bullet points.

### 4. Conclusion - H2 heading containing the keyword
- 2-3 bullets summarizing the core takeaway
- The CTA itself, clearly stated

Output clean Markdown only.`;

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
        model: "claude-3-5-sonnet-20241022",
        max_tokens: 1500,
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: userMessage }],
      }),
    });

    const data = await response.json();

    // Return full API response for debugging
    if (!data.content || data.content.length === 0) {
      return {
        statusCode: 500,
        body: JSON.stringify({ 
          error: "No content in response",
          debug: JSON.stringify(data)
        }),
      };
    }

    const text = data.content.map((b) => b.text || "").join("");

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
