export async function llamaCommentary({ report, model = "llama3.2" }) {
  const payload = {
    model,
    messages: [
      {
        role: "system",
        content:
          "You are a witty music analyst. Write punchy, affectionate commentary. No cringe. Avoid moralizing. Keep it concise.",
      },
      {
        role: "user",
        content: `
Here are stats from my Spotify listening history. Create:
1) A 1-sentence tagline (funny, accurate)
2) A short paragraph (80-140 words) describing my listening personality
3) 3 quirky superlatives (like awards), each with a short reason

Stats (JSON):
${JSON.stringify(report, null, 2)}
`,
      },
    ],
    stream: false,
    options: {
      temperature: 0.9,
    },
  };

  const res = await fetch("/ollama/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`Ollama error ${res.status}: ${txt}`);
  }

  const data = await res.json();
  return data?.message?.content || "";
}