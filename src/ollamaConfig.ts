import { ollama } from "../llm";

const response = await ollama.chat({
  model: "deepseek-v3.2",
  messages: [
    { role: "system", content: "You are a concise trading assistant." },
    {
      role: "user",
      content: "Give me a one-sentence overview of current BTC market sentiment.",
    },
  ],
});
console.log({ response });