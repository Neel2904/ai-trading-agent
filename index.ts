import { ollama } from "./llm";
import type { ChatMessage } from "./llm/types";
import { filledPrompt } from "./src/prompt";
import { executeToolCall, tools } from "./src/tools";

async function main() {
  const message: ChatMessage[] = [{ role: "user", content: filledPrompt }];
  const chatResponse = await ollama.chat({
    model: "deepseek-v3.2",
    messages: message,
    tools,
  });

  if (chatResponse.message.tool_calls?.length) {
    const toolMessages: ChatMessage[] = [];
    for (const call of chatResponse.message.tool_calls) {
      const result = await executeToolCall(call);
      toolMessages.push({
        role: "tool",
        content: typeof result === "string" ? result : JSON.stringify(result),
        tool_call_id: call.id ?? call.function.name,
      });
    }
    return;
  }
}

async function mainWithGlobalErrorCatch() {
  try {
    await main();
  } catch (error) {
    console.error("Unhandled error in main", error);
  }
}

let timer = 0
console.log("Running main loop...", timer++);
mainWithGlobalErrorCatch();

setInterval(() => {
  console.log("Running main loop...", ++timer);
  mainWithGlobalErrorCatch()
}, 1000 * 60 * 5); // every 5 minutes
