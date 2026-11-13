
export async function onRequestPost({ request, env }) {
  const cors = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type"
  };

  try {
    if (!env.GEMINI_API_KEY) {
      return Response.json(
        { error: "সার্ভারে Gemini API key সেট করা হয়নি।" },
        { status: 503, headers: cors }
      );
    }

    const body = await request.json();

    if (!Array.isArray(body.contents) || body.contents.length === 0) {
      return Response.json(
        { error: "প্রশ্ন পাওয়া যায়নি।" },
        { status: 400, headers: cors }
      );
    }

    const contents = body.contents.slice(-16).map(item => ({
      role: item.role === "model" ? "model" : "user",
      parts: [{
        text: String(item.parts?.[0]?.text || "").slice(0, 8000)
      }]
    }));

    const upstream = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=" +
      encodeURIComponent(env.GEMINI_API_KEY),
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system_instruction: {
            parts: [{
              text: "You are Alif AI, a helpful, safe, friendly assistant. Reply in the language used by the user. For Bangla, use clear and simple Bangla. Help with learning, explanations, translations and MCQs. Be honest when uncertain."
            }]
          },
          contents,
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 1200
          }
        })
      }
    );

    const result = await upstream.json();

    if (!upstream.ok) {
      return Response.json(
        { error: result.error?.message || "Gemini API request failed." },
        { status: upstream.status, headers: cors }
      );
    }

    const reply = result.candidates?.[0]?.content?.parts
      ?.map(p => p.text || "").join("") || "";

    return Response.json({ reply }, { headers: cors });

  } catch (e) {
    return Response.json(
      { error: "অনুরোধটি প্রক্রিয়া করা যায়নি।" },
      { status: 500, headers: cors }
    );
  }
}

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type"
    }
  });
}
