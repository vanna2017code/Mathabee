import fetch from "node-fetch";

export async function generateQuiz(difficulty = "medium") {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "Generate clean math quiz questions." },
        {
          role: "user",
          content: `
Generate 10 ${difficulty} math questions.
Return JSON only:
[
  { "question":"", "choices":["A","B","C","D"], "answer":"A" }
]
`
        }
      ]
    })
  });

  const data = await res.json();
  return JSON.parse(data.choices[0].message.content);
}
