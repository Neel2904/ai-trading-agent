import { ollama } from "./llm";
import type { ChatMessage } from "./llm/types";
import { binanceClient } from "./src/binanceConfig";
import { filledPrompt, PROMPT } from "./src/prompt";
import { executeToolCall, tools } from "./src/tools";

async function main() {
  // const message: ChatMessage[] = [{ role: "user", content: PROMPT }];
  // const chatResponse = await ollama.chat({
  //   model: "deepseek-v3.2",
  //   messages: message,
  //   tools,
  // });

  // if (chatResponse.message.tool_calls?.length) {
  //   const toolMessages: ChatMessage[] = [];
  //   for (const call of chatResponse.message.tool_calls) {
  //     const result = await executeToolCall(call);
  //     toolMessages.push({
  //       role: "tool",
  //       content: typeof result === "string" ? result : JSON.stringify(result),
  //       tool_call_id: call.id ?? call.function.name,
  //     });
  //   }
  //   return;
  // }

  console.log(filledPrompt);

}

if (import.meta.main) {
  main().catch((err) => {
    console.error("Global error catching for error:", err);
    process.exitCode = 1;
  });
}
