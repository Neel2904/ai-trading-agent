import {
  type ChatRequest,
  type ModelListResponse,
  type OllamaChatResponse,
  type OllamaClientOptions,
  type OllamaModelConfig,
  type OllamaOptions,
} from "./types";

const DEFAULT_OLLAMA_HOST = "http://127.0.0.1:11434";

export class OllamaClient {
  private baseUrl: string;
  private apiKey?: string;
  private models: Record<string, OllamaModelConfig>;
  private defaultModel: string;

  constructor(options: OllamaClientOptions) {
    this.baseUrl = (options.baseUrl ?? process.env.OLLAMA_HOST ?? DEFAULT_OLLAMA_HOST).replace(/\/$/, "");
    this.apiKey = options.apiKey ?? process.env.OLLAMA_API_KEY;
    this.models = options.models;
    this.defaultModel = options.defaultModel;
  }

  registerModel(alias: string, config: OllamaModelConfig) {
    this.models[alias] = config;
  }

  listRegisteredModels() {
    return { ...this.models };
  }

  async chat(params: ChatRequest): Promise<OllamaChatResponse> {
    const model = this.resolveModel(params.model);
    const payload = {
      model: model.name,
      messages: params.messages,
      stream: false,
      options: this.mergeOptions(model.options, params.options),
      ...(params.tools ? { tools: params.tools } : {}),
      ...(params.toolChoice ? { tool_choice: params.toolChoice } : {}),
    };
    return this.post<OllamaChatResponse>("/api/chat", payload);
  }

  async listModels(): Promise<ModelListResponse> {
    const response = await fetch(`${this.baseUrl}/api/tags`, {
      method: "GET",
      headers: this.buildHeaders(),
    });

    if (!response.ok) {
      const message = await response.text().catch(() => response.statusText);
      throw new Error(`Failed to list Ollama models (${response.status}): ${message}`);
    }

    return (await response.json()) as ModelListResponse;
  }

  private resolveModel(model?: string): OllamaModelConfig {
    const key = model ?? this.defaultModel;
    if (!key) {
      throw new Error("No model provided and no defaultModel configured for Ollama client");
    }

    const registered = this.models[key];
    if (registered) return registered;
    return { name: key };
  }

  private mergeOptions(base?: OllamaOptions, override?: OllamaOptions): OllamaOptions | undefined {
    if (!base && !override) return undefined;
    return { ...(base ?? {}), ...(override ?? {}) };
  }

  private buildHeaders() {
    const headers = new Headers({
      "Content-Type": "application/json",
      Accept: "application/json",
    });

    if (this.apiKey) {
      headers.set("Authorization", `Bearer ${this.apiKey}`);
    }

    return headers;
  }

  private async post<T>(path: string, payload: unknown): Promise<T> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      method: "POST",
      headers: this.buildHeaders(),
      body: JSON.stringify(payload),
    });

    const rawBody = await response.text().catch(() => "");

    if (!response.ok) {
      const message = rawBody || response.statusText;
      throw new Error(`Ollama request failed (${response.status}): ${message}`);
    }

    const contentType = response.headers.get("content-type") ?? "";
    if (!contentType.includes("application/json")) {
      const snippet = rawBody.slice(0, 500);
      throw new Error(
        `Unexpected non-JSON response from Ollama (content-type: ${contentType || "unknown"}). Body: ${snippet}`,
      );
    }

    try {
      return JSON.parse(rawBody) as T;
    } catch (err) {
      const snippet = rawBody.slice(0, 500);
      throw new Error(`Failed to parse JSON from Ollama response: ${(err as Error).message}. Body: ${snippet}`);
    }
  }
}
