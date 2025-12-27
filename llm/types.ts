export type ChatRole = "system" | "user" | "assistant" | "tool";

export interface ChatMessage {
  role: ChatRole;
  content: string;
  images?: string[];
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
