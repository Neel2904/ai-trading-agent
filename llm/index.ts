import { OllamaClient } from "./ollama";
import type {
  ChatMessage,
  ChatRequest,
  GenerateRequest,
  ModelListResponse,
  OllamaChatResponse,
  OllamaGenerateResponse,
  OllamaModelConfig,
  OllamaOptions,
} from "./types";

const defaultModelName = process.env.OLLAMA_MODEL ?? "llama3";
const defaultOllamaModels: Record<string, OllamaModelConfig> = {
  [defaultModelName]: { name: defaultModelName },
};

export const ollama = new OllamaClient({
  baseUrl: process.env.OLLAMA_HOST,
  defaultModel: defaultModelName,
  models: defaultOllamaModels,
});

export { OllamaClient };
export type {
  ChatMessage,
  ChatRequest,
  GenerateRequest,
  ModelListResponse,
  OllamaChatResponse,
  OllamaGenerateResponse,
  OllamaModelConfig,
  OllamaOptions,
};
