import { BinanceRestClient } from "./binance-sdk";
import { ollama } from "./llm";
import { PROMPT } from "./src/prompt";

async function main() {
  const response = ollama.chat({
    model: "llama2",
    messages: [
      {
        role: "system",
        content: "You are an expert trader. You were given $1000 dollars to trade with. You are trading on the crypto market. You are given the following information.",
      },
      {
        role: "user",
        content: PROMPT,
      },
    ],
  })
}

if (import.meta.main) {
  main().catch((err) => {
    console.error("Demo failed", err);
    process.exitCode = 1;
  });
}
