import type {
  ChatMessage,
  ChatRequest,
  ModelListResponse,
  OpenRouterChatResponse,
  OpenRouterModelConfig,
  OpenRouterOptions,
  ToolCall,
  OpenRouterTool,
  ToolChoice,
} from "./types";
import { OpenRouterClient } from "./openrouter";

const defaultModelName = process.env.OPENROUTER_MODEL ?? "openrouter/auto";
const defaultModels: Record<string, OpenRouterModelConfig> = {
  [defaultModelName]: { name: defaultModelName },
};

export const openrouter = new OpenRouterClient({
  baseUrl: process.env.OPENROUTER_BASE_URL,
  apiKey: process.env.OPENROUTER_API_KEY,
  referer: process.env.OPENROUTER_SITE_URL ?? process.env.HTTP_REFERER,
  title: process.env.OPENROUTER_APP_TITLE,
  defaultModel: defaultModelName,
  models: defaultModels,
});

export { OpenRouterClient };
export type {
  ChatMessage,
  ChatRequest,
  ModelListResponse,
  OpenRouterChatResponse,
  OpenRouterModelConfig,
  OpenRouterOptions,
  OpenRouterTool,
  ToolCall,
  ToolChoice,
};
