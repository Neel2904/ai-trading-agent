export type ChatRole = "system" | "user" | "assistant" | "tool";

export interface ChatMessage {
  role: ChatRole;
  content: string;
  images?: string[];
  tool_call_id?: string;
  tool_calls?: ToolCall[];
}

export interface OllamaOptions {
  temperature?: number;
  top_p?: number;
  top_k?: number;
  num_predict?: number;
  stop?: string[];
}

export interface OllamaModelConfig {
  name: string;
  options?: OllamaOptions;
}

export interface OllamaClientOptions {
  baseUrl?: string;
  apiKey?: string;
  models: Record<string, OllamaModelConfig>;
  defaultModel: string;
}

export interface ChatRequest {
  messages: ChatMessage[];
  model?: string;
  options?: OllamaOptions;
  tools?: OllamaTool[];
  toolChoice?: ToolChoice;
}

export interface GenerateRequest {
  prompt: string;
  model?: string;
  options?: OllamaOptions;
}

export interface OllamaChatResponse {
  model: string;
  message: ChatMessage;
  done: boolean;
}

export interface OllamaGenerateResponse {
  model: string;
  response: string;
  done: boolean;
}

export interface OllamaModelSummary {
  name: string;
  modified_at?: string;
  size?: number;
  digest?: string;
  details?: Record<string, unknown>;
}

export interface ModelListResponse {
  models: OllamaModelSummary[];
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

export interface OllamaTool {
  type: "function";
  function: {
    name: string;
    description?: string;
    parameters?: Record<string, unknown>;
  };
}
