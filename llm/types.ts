export type ChatRole = "system" | "user" | "assistant" | "tool";

export interface ChatMessage {
  role: ChatRole;
  content: string | null;
  name?: string;
  images?: string[];
  tool_call_id?: string;
  tool_calls?: ToolCall[];
}

export interface OpenRouterOptions {
  temperature?: number;
  top_p?: number;
  max_tokens?: number;
  stop?: string[];
  presence_penalty?: number;
  frequency_penalty?: number;
}

export interface OpenRouterModelConfig {
  name: string;
  options?: OpenRouterOptions;
}

export interface OpenRouterClientOptions {
  baseUrl?: string;
  apiKey?: string;
  models: Record<string, OpenRouterModelConfig>;
  defaultModel: string;
  referer?: string;
  title?: string;
}

export interface ChatRequest {
  messages: ChatMessage[];
  model?: string;
  options?: OpenRouterOptions;
  tools?: OpenRouterTool[];
  toolChoice?: ToolChoice;
}

export interface OpenRouterUsage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}

export interface OpenRouterChatResponseChoice {
  index: number;
  message: ChatMessage;
  finish_reason?: string;
}

export interface OpenRouterAPIChatResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: OpenRouterChatResponseChoice[];
  usage?: OpenRouterUsage;
}

export interface OpenRouterChatResponse {
  id: string;
  model: string;
  created: number;
  message: ChatMessage;
  finish_reason?: string;
  usage?: OpenRouterUsage;
}

export interface OpenRouterModelSummary {
  id: string;
  created?: number;
  owned_by?: string;
  object?: string;
}

export interface ModelListResponse {
  data: OpenRouterModelSummary[];
  object: "list";
}

export type ToolChoice =
  | "auto"
  | "none"
  | {
      type: "function";
      function: {
        name: string;
      };
    };

export interface ToolCall {
  id?: string;
  type: "function";
  function: {
    name: string;
    arguments: string | Record<string, unknown>;
  };
}

export interface OpenRouterTool {
  type: "function";
  function: {
    name: string;
    description?: string;
    parameters?: Record<string, unknown>;
  };
}
