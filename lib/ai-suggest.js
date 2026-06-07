const PROMPTS = {
  profile_intro: "Rewrite this personal website intro to be concise, professional, and warm (2-3 sentences). Keep facts accurate. Return only the rewritten text.",
  profile_tagline: "Suggest a polished professional tagline (under 12 words) using pipe separators, e.g. 'Role · Specialty · Focus'. Return only the tagline.",
  about_bio: "Improve this About bio for a personal portfolio: clear, professional, first-person, 4-6 sentences. Highlight embedded/software engineering strengths. Return only the bio.",
  job_description: "Improve this job description for a portfolio website. Use blank lines between sections, project titles, bullet lines starting with •, and a final Tech: line with comma-separated skills. Return only the description.",
  education_description: "Improve this education description: mention degree highlights, GPA if present, and relevant skills briefly. Return only the description.",
  experience_description: "Improve this project/experience summary in 1-2 compelling sentences for a portfolio. Return only the summary.",
  roadmap_description: "Improve this career roadmap goal description: specific, actionable, professional. Return only the description.",
};

function fallbackSuggest(section, currentText, context) {
  const text = (currentText || "").trim();
  const tips = [];

  if (section === "job_description") {
    tips.push(
      "Use this structure:\n\nCity · On-site\n\nProject Name\nOne-line summary.\n• Achievement with metrics\n• Another achievement\n\nTech: Skill1, Skill2"
    );
    if (text) tips.push(`\nEdited draft (cleaned formatting):\n\n${text.replace(/ — /g, "\n").replace(/\.\s+/g, ".\n• ")}`);
  } else if (section === "about_bio") {
    tips.push(
      "Start with your current role and location. Mention 2-3 technical domains. End with education or what you're passionate about.\n\nExample opening: \"I'm an Advanced Software Engineer specializing in embedded Linux and STB UI development...\""
    );
    if (text) tips.push(`\nYour text is ${text.split(/\s+/).length} words — aim for 80-120 words for a strong bio.`);
  } else if (section === "profile_intro") {
    tips.push("Keep it to 2 sentences: who you are + what visitors will find on this page.");
    if (text) tips.push(`\nSuggestion:\n${text.split(".").slice(0, 2).join(". ").trim()}.`);
  } else if (section === "profile_tagline") {
    tips.push("Format: Primary Role · Technical Focus · Secondary Strength\n\nExample: Advanced Software Engineer · Embedded Linux · UI Development");
  } else if (section === "roadmap_description") {
    tips.push("Describe the goal, why it matters, and 1-2 concrete steps you'll take.");
    if (text) tips.push(`\nRefined:\n${text}`);
  } else {
    tips.push("Use active verbs, quantify impact where possible, and keep paragraphs scannable.");
    if (text) tips.push(`\nRefined:\n${text}`);
  }

  if (context?.title) tips.unshift(`Context: ${context.title}${context.company ? ` at ${context.company}` : ""}`);

  return {
    suggestion: tips.join("\n"),
    source: "template",
    note: "Install Ollama (ollama.com) and run `ollama pull llama3.2` for free local AI suggestions.",
  };
}

async function suggestWithOllama({ section, currentText, context }) {
  const baseUrl = (process.env.OLLAMA_URL || "http://127.0.0.1:11434").replace(/\/$/, "");
  const model = process.env.OLLAMA_MODEL || "llama3.2";
  const promptKey = section || "about_bio";
  const systemPrompt = PROMPTS[promptKey] || "Improve this text for a professional personal portfolio website. Be concise and accurate. Return only the improved text.";

  const userContent = [
    context?.title ? `Title: ${context.title}` : "",
    context?.company ? `Company: ${context.company}` : "",
    context?.institution ? `Institution: ${context.institution}` : "",
    context?.status ? `Status: ${context.status}` : "",
    `Current text:\n${currentText || "(empty)"}`,
  ].filter(Boolean).join("\n");

  const res = await fetch(`${baseUrl}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userContent },
      ],
      stream: false,
      options: { temperature: 0.7, num_predict: 800 },
    }),
    signal: AbortSignal.timeout(Number(process.env.OLLAMA_TIMEOUT_MS) || 60000),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Ollama error (${res.status}): ${err.slice(0, 200)}`);
  }

  const data = await res.json();
  const suggestion = data.message?.content?.trim();
  if (!suggestion) throw new Error("Empty response from Ollama");

  return {
    suggestion,
    source: "ollama",
    note: `Generated locally via Ollama (${model})`,
  };
}

async function suggestWithAI({ section, field, currentText, context }) {
  const promptKey = section || field || "about_bio";

  try {
    return await suggestWithOllama({ section: promptKey, currentText, context });
  } catch (err) {
    console.error("Ollama suggest failed:", err.message);
    const fallback = fallbackSuggest(promptKey, currentText, context);
    fallback.note = `${fallback.note} (${err.message})`;
    return fallback;
  }
}

module.exports = { suggestWithAI };
