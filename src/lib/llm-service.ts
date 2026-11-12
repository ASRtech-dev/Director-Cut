import { getSetting } from "./settings-service";

export async function generateCompletion(
  provider: "openai" | "gemini" | "deepseek" | "kimi" | "qwen",
  promptText: string,
  modelOverride?: string
): Promise<{ text: string; inputTokens?: number; outputTokens?: number }> {
  if (provider === "openai") {
    const apiKey = await getSetting("openai_api_key");
    const model = modelOverride || (await getSetting("openai_model")) || "gpt-4o";

    if (!apiKey) {
      throw new Error("OpenAI API Key is not configured. Please add it in Developer Settings (gear icon).");
    }

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [{ role: "user", content: promptText }],
        temperature: 0.2,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      let parsedErr;
      try { parsedErr = JSON.parse(errText); } catch { /* ignore */ }
      const errorMsg = parsedErr?.error?.message || errText || `HTTP ${response.status}`;
      throw new Error(`OpenAI API Error: ${errorMsg}`);
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content || "";
    const inputTokens = data.usage?.prompt_tokens;
    const outputTokens = data.usage?.completion_tokens;

    return { text, inputTokens, outputTokens };
  } else if (provider === "gemini") {
    const apiKey = await getSetting("gemini_api_key");
    const model = modelOverride || (await getSetting("gemini_model")) || "gemini-1.5-pro";

    if (!apiKey) {
      throw new Error("Gemini API Key is not configured. Please add it in Developer Settings (gear icon).");
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey,
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: promptText }],
            },
          ],
          generationConfig: {
            temperature: 0.2,
          },
        }),
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      let parsedErr;
      try { parsedErr = JSON.parse(errText); } catch { /* ignore */ }
      const errorMsg = parsedErr?.error?.message || errText || `HTTP ${response.status}`;
      throw new Error(`Gemini API Error: ${errorMsg}`);
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    const inputTokens = data.usageMetadata?.promptTokenCount;
    const outputTokens = data.usageMetadata?.candidatesTokenCount;

    return { text, inputTokens, outputTokens };
  } else if (provider === "deepseek") {
    const apiKey = await getSetting("deepseek_api_key");
    const model = modelOverride || (await getSetting("deepseek_model")) || "deepseek-chat";

    if (!apiKey) {
      throw new Error("DeepSeek API Key is not configured. Please add it in Developer Settings (gear icon).");
    }

    const response = await fetch("https://api.deepseek.com/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [{ role: "user", content: promptText }],
        temperature: 0.2,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      let parsedErr;
      try { parsedErr = JSON.parse(errText); } catch { /* ignore */ }
      const errorMsg = parsedErr?.error?.message || errText || `HTTP ${response.status}`;
      throw new Error(`DeepSeek API Error: ${errorMsg}`);
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content || "";
    const inputTokens = data.usage?.prompt_tokens;
    const outputTokens = data.usage?.completion_tokens;

    return { text, inputTokens, outputTokens };
  } else if (provider === "kimi") {
    const apiKey = await getSetting("kimi_api_key");
    const model = modelOverride || (await getSetting("kimi_model")) || "moonshot-v1-8k";

    if (!apiKey) {
      throw new Error("Kimi API Key is not configured. Please add it in Developer Settings (gear icon).");
    }

    const response = await fetch("https://api.moonshot.cn/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [{ role: "user", content: promptText }],
        temperature: 0.2,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      let parsedErr;
      try { parsedErr = JSON.parse(errText); } catch { /* ignore */ }
      const errorMsg = parsedErr?.error?.message || errText || `HTTP ${response.status}`;
      throw new Error(`Kimi API Error: ${errorMsg}`);
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content || "";
    const inputTokens = data.usage?.prompt_tokens;
    const outputTokens = data.usage?.completion_tokens;

    return { text, inputTokens, outputTokens };
  } else if (provider === "qwen") {
    const apiKey = await getSetting("qwen_api_key");
    const model = modelOverride || (await getSetting("qwen_model")) || "qwen-plus";

    if (!apiKey) {
      throw new Error("Qwen API Key is not configured. Please add it in Developer Settings (gear icon).");
    }

    const endpoints = [
      "https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions",
      "https://dashscope-intl.aliyuncs.com/compatible-mode/v1/chat/completions"
    ];

    let lastError = null;
    let response = null;

    for (const url of endpoints) {
      try {
        response = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model,
            messages: [{ role: "user", content: promptText }],
            temperature: 0.2,
          }),
        });
        if (response.ok) {
          break;
        } else {
          lastError = await response.text();
        }
      } catch (err: any) {
        lastError = err.message || err;
      }
    }

    if (!response || !response.ok) {
      throw new Error(`Qwen API Error: ${lastError || "Failed to connect to Qwen endpoints"}`);
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content || "";
    const inputTokens = data.usage?.prompt_tokens;
    const outputTokens = data.usage?.completion_tokens;

    return { text, inputTokens, outputTokens };
  } else {
    throw new Error(`Unknown provider: ${provider}`);
  }
}

export async function testConnection(
  provider: "openai" | "gemini" | "deepseek" | "kimi" | "qwen", 
  apiKey: string, 
  model: string
): Promise<boolean> {
  if (provider === "openai") {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [{ role: "user", content: "ping" }],
        max_tokens: 5,
      }),
    });
    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`OpenAI: HTTP ${response.status} - ${errText}`);
    }
    return true;
  } else if (provider === "gemini") {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey,
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: "ping" }] }],
          generationConfig: { maxOutputTokens: 5 },
        }),
      }
    );
    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Gemini: HTTP ${response.status} - ${errText}`);
    }
    return true;
  } else if (provider === "deepseek") {
    const response = await fetch("https://api.deepseek.com/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [{ role: "user", content: "ping" }],
        max_tokens: 5,
      }),
    });
    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`DeepSeek: HTTP ${response.status} - ${errText}`);
    }
    return true;
  } else if (provider === "kimi") {
    const response = await fetch("https://api.moonshot.cn/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [{ role: "user", content: "ping" }],
        max_tokens: 5,
      }),
    });
    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Kimi: HTTP ${response.status} - ${errText}`);
    }
    return true;
  } else if (provider === "qwen") {
    const endpoints = [
      "https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions",
      "https://dashscope-intl.aliyuncs.com/compatible-mode/v1/chat/completions"
    ];
    let errors: string[] = [];
    for (const url of endpoints) {
      try {
        const response = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model,
            messages: [{ role: "user", content: "ping" }],
            max_tokens: 5,
          }),
        });
        if (response.ok) {
          return true;
        } else {
          const txt = await response.text();
          errors.push(`${url}: HTTP ${response.status} - ${txt}`);
        }
      } catch (err: any) {
        errors.push(`${url}: ${err.message || err}`);
      }
    }
    throw new Error(`Connection failed. Details:\n${errors.join("\n")}`);
  }
  return false;
}
