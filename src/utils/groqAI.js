/**
 * Groq AI Integration for KiranaDeals
 * Uses Groq's fast LLM API for smart discount reasoning,
 * product tips, and customer recommendations.
 */

const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

export const isGroqConfigured = Boolean(GROQ_API_KEY);

/**
 * Call Groq API with a prompt
 */
async function callGroq(messages, maxTokens = 300) {
  if (!GROQ_API_KEY) {
    throw new Error("Groq API key not configured");
  }

  const response = await fetch(GROQ_API_URL, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${GROQ_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages,
      max_tokens: maxTokens,
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Groq API error: ${response.status} ${err}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || "";
}

/**
 * Get AI-powered discount reasoning for a product
 * Returns smart analysis beyond simple if/else
 */
export async function getAIDiscountReasoning({
  productName,
  category,
  mrp,
  daysLeft,
  quantity,
  suggestedDiscount,
}) {
  const messages = [
    {
      role: "system",
      content: `You are a smart pricing assistant for KiranaDeals, an Indian hyperlocal near-expiry discount platform for kirana (grocery) shops. 
You help shopkeepers set the right discount for near-expiry products. Be practical, brief, and speak in a friendly Indian English tone.
Always respond in valid JSON format with these fields:
{
  "reasoning": "2-3 sentence explanation of why this discount makes sense",
  "tip": "One actionable selling tip for the shopkeeper",
  "customerAppeal": "One line that would appeal to a customer for this deal"
}`
    },
    {
      role: "user",
      content: `Product: ${productName}
Category: ${category}
MRP: ₹${mrp}
Days until expiry: ${daysLeft}
Stock quantity: ${quantity} units
Our algorithm suggests: ${suggestedDiscount}% discount (final price ₹${Math.round(mrp * (1 - suggestedDiscount / 100))})

Analyze this and give your reasoning, a selling tip, and a customer appeal line.`
    }
  ];

  try {
    const raw = await callGroq(messages, 250);
    // Parse JSON from response (handle markdown code blocks)
    const cleaned = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    return JSON.parse(cleaned);
  } catch (err) {
    console.error("Groq AI reasoning error:", err);
    return {
      reasoning: `${daysLeft} day${daysLeft !== 1 ? "s" : ""} to expiry — ${suggestedDiscount}% discount keeps the product competitive while reducing waste.`,
      tip: "Place near the billing counter for impulse pickups.",
      customerAppeal: `Save ₹${Math.round(mrp * suggestedDiscount / 100)} on ${productName} — grab it before it's gone!`,
    };
  }
}

/**
 * Get AI-powered product recommendations for customers
 */
export async function getCustomerRecommendation(deals) {
  if (!deals || deals.length === 0) return null;
  
  const dealSummary = deals.slice(0, 5).map(d => 
    `${d.name} (${d.category}, ${d.discount}% off, ₹${Math.round(d.mrp * (1 - d.discount/100))}, ${d.daysLeft} days left)`
  ).join("\n");

  const messages = [
    {
      role: "system",
      content: `You are a friendly shopping assistant for KiranaDeals, an Indian hyperlocal near-expiry discount platform. 
Help customers find the best deals. Be brief, warm, and practical. Respond in JSON format:
{
  "greeting": "A short personalized greeting",
  "topPick": "Why the best deal is worth grabbing",
  "savingTip": "A quick money-saving tip"
}`
    },
    {
      role: "user",
      content: `Here are the deals available near the customer:\n${dealSummary}\n\nGive a brief recommendation.`
    }
  ];

  try {
    const raw = await callGroq(messages, 200);
    const cleaned = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    return JSON.parse(cleaned);
  } catch (err) {
    console.error("Groq recommendation error:", err);
    return null;
  }
}
