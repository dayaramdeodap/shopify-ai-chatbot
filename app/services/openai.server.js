/**
 * OpenAI Service
 * Streaming + tool calls using OpenAI Responses API
 */
import OpenAI from "openai";
import AppConfig from "./config.server";
import systemPrompts from "../prompts/prompts.json";

function safeJsonParse(s) {
  try {
    return JSON.parse(s);
  } catch {
    return { _raw: s };
  }
}

// Convert Anthropic tool format -> OpenAI function tool format
function normalizeTools(tools) {
  if (!tools || tools.length === 0) return undefined;

  return tools.map((t) => {
    // already OpenAI format
    if (t && t.type === "function" && t.function && t.function.name) return t;

    // anthropic-like: { name, description, input_schema }
    if (t && t.name && t.input_schema) {
      return {
        type: "function",
        function: {
          name: t.name,
          description: t.description || "",
          parameters: t.input_schema,
        },
      };
    }

    return t;
  });
}

// Your messages may be string or Anthropic blocks. Normalize to text.
function normalizeMessages(messages) {
  return (messages || []).map((m) => {
    if (typeof m?.content === "string") return { role: m.role, content: m.content };

    if (Array.isArray(m?.content)) {
      const text = m.content
        .filter((c) => c?.type === "text" && typeof c?.text === "string")
        .map((c) => c.text)
        .join("\n");
      return { role: m.role, content: text };
    }

    return { role: m.role, content: String(m?.content ?? "") };
  });
}

export function createOpenAIService(apiKey = process.env.OPENAI_API_KEY) {
  if (!apiKey) throw new Error("Missing OPENAI_API_KEY");

  const client = new OpenAI({ apiKey });

  const getSystemPrompt = (promptType) => {
    return (
      systemPrompts.systemPrompts?.[promptType]?.content ||
      systemPrompts.systemPrompts?.[AppConfig.api.defaultPromptType]?.content ||
      ""
    );
  };

  /**
   * Streams a conversation with OpenAI
   * Keeps same handler style as your Claude service.
   */
  const streamConversation = async (
    { messages, promptType = AppConfig.api.defaultPromptType, tools },
    streamHandlers = {}
  ) => {
    const systemInstruction = getSystemPrompt(promptType);
    const model = AppConfig.api.defaultModel;
    const openaiTools = normalizeTools(tools);
    const input = normalizeMessages(messages);

    const stream = await client.responses.stream({
      model,
      input,
      instructions: systemInstruction,
      tools: openaiTools,
      tool_choice: openaiTools ? "auto" : undefined,
      max_output_tokens: AppConfig.api.maxTokens,
    });

    // Text streaming
    stream.on("response.output_text.delta", (evt) => {
      if (streamHandlers.onText && evt?.delta) streamHandlers.onText(evt.delta);
    });

    // Tool calls complete
    stream.on("response.output_item.done", async (evt) => {
      const item = evt?.item;
      if (!item) return;

      // function call item typically has name + arguments
      const name = item.name || item?.function?.name;
      const argsRaw = item.arguments || item?.function?.arguments;

      if (name && streamHandlers.onToolUse) {
        await streamHandlers.onToolUse({
          type: "tool_use",
          id: item.call_id || item.id,
          name,
          input: typeof argsRaw === "string" ? safeJsonParse(argsRaw) : (argsRaw || {}),
          raw: item,
        });
      }
    });

    const finalResponse = await stream.finalResponse();

    const finalMessageLike = {
      role: "assistant",
      content: [{ type: "text", text: finalResponse.output_text || "" }],
      raw: finalResponse,
    };

    if (streamHandlers.onMessage) streamHandlers.onMessage(finalMessageLike);

    return finalMessageLike;
  };

  return { streamConversation, getSystemPrompt };
}

export default { createOpenAIService };