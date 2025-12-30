import {
  type ChatRequest,
  type ModelListResponse,
  type OpenRouterAPIChatResponse,
  type OpenRouterChatResponse,
  type OpenRouterClientOptions,
  type OpenRouterModelConfig,
  type OpenRouterOptions,
} from "./types";

const DEFAULT_OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1";

export class OpenRouterClient {
  private baseUrl: string;
  private apiKey?: string;
  private models: Record<string, OpenRouterModelConfig>;
  private defaultModel: string;
  private referer?: string;
  private title?: string;

  constructor(options: OpenRouterClientOptions) {
    this.baseUrl = (options.baseUrl ?? DEFAULT_OPENROUTER_BASE_URL).replace(/\/$/, "");
    this.apiKey = options.apiKey ?? process.env.OPENROUTER_API_KEY;
    this.models = options.models;
    this.defaultModel = options.defaultModel;
    this.referer = options.referer ?? process.env.OPENROUTER_SITE_URL ?? process.env.HTTP_REFERER;
    this.title = options.title ?? process.env.OPENROUTER_APP_TITLE;
  }

  registerModel(alias: string, config: OpenRouterModelConfig) {
    this.models[alias] = config;
  }

  listRegisteredModels() {
    return { ...this.models };
  }

  async chat(params: ChatRequest): Promise<OpenRouterChatResponse> {
    const model = this.resolveModel(params.model);
    const options = this.mergeOptions(model.options, params.options);
    const payload = {
      model: model.name,
      messages: params.messages,
      stream: false,
      ...(params.tools ? { tools: params.tools } : {}),
      ...(params.toolChoice ? { tool_choice: params.toolChoice } : {}),
      ...(options ?? {}),
    };

    const response = await this.post<OpenRouterAPIChatResponse>("/chat/completions", payload);
    const choice = response.choices?.[0];
    if (!choice) {
      throw new Error("OpenRouter returned no choices for chat completion");
    }

    return {
      id: response.id,
      model: response.model,
      created: response.created,
      message: choice.message,
      finish_reason: choice.finish_reason,
      usage: response.usage,
    };
  }

  async listModels(): Promise<ModelListResponse> {
    return this.get<ModelListResponse>("/models");
  }

  private resolveModel(model?: string): OpenRouterModelConfig {
    const key = model ?? this.defaultModel;
    if (!key) {
      throw new Error("No model provided and no defaultModel configured for OpenRouter client");
    }

    const registered = this.models[key];
    if (registered) return registered;
    return { name: key };
  }

  private mergeOptions(base?: OpenRouterOptions, override?: OpenRouterOptions): OpenRouterOptions | undefined {
    if (!base && !override) return undefined;
    return { ...(base ?? {}), ...(override ?? {}) };
  }

  private buildHeaders() {
    const headers = new Headers({
      "Content-Type": "application/json",
      Accept: "application/json",
    });

    if (!this.apiKey) {
      throw new Error("OPENROUTER_API_KEY is required for LLM calls");
    }

    headers.set("Authorization", `Bearer ${this.apiKey}`);

    if (this.referer) {
      headers.set("HTTP-Referer", this.referer);
    }

    if (this.title) {
      headers.set("X-Title", this.title);
    }

    return headers;
  }

  private async get<T>(path: string): Promise<T> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      method: "GET",
      headers: this.buildHeaders(),
    });
    return this.parseResponse<T>(response);
  }

  private async post<T>(path: string, payload: unknown): Promise<T> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      method: "POST",
      headers: this.buildHeaders(),
      body: JSON.stringify(payload),
    });
    return this.parseResponse<T>(response);
  }

  private async parseResponse<T>(response: Response): Promise<T> {
    const rawBody = await response.text().catch(() => "");

    if (!response.ok) {
      const message = rawBody || response.statusText;
      throw new Error(`OpenRouter request failed (${response.status}): ${message}`);
    }

    const contentType = response.headers.get("content-type") ?? "";
    if (!contentType.includes("application/json")) {
      const snippet = rawBody.slice(0, 500);
      throw new Error(
        `Unexpected non-JSON response from OpenRouter (content-type: ${contentType || "unknown"}). Body: ${snippet}`,
      );
    }

    try {
      return JSON.parse(rawBody) as T;
    } catch (err) {
      const snippet = rawBody.slice(0, 500);
      throw new Error(`Failed to parse JSON from OpenRouter response: ${(err as Error).message}. Body: ${snippet}`);
    }
  }
}
