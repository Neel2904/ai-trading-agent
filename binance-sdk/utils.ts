import { createHmac } from "crypto";
import { RequestParams } from "./types";

export function normalizeValue(value: string | number | boolean): string {
  if (typeof value === "boolean") {
    return value ? "true" : "false";
  }

  return String(value);
}

export function buildQuery(params: RequestParams = {}): URLSearchParams {
  const search = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value === undefined) continue;
    search.append(key, normalizeValue(value));
  }

  return search;
}

export function signPayload(payload: string, apiSecret: string): string {
  return createHmac("sha256", apiSecret).update(payload).digest("hex");
}

export function withTimestamp(
  params: RequestParams,
  recvWindow?: number,
): RequestParams {
  return {
    ...params,
    timestamp: Date.now(),
    ...(recvWindow ? { recvWindow } : {}),
  };
}

export function isJsonResponse(headers: Headers): boolean {
  const contentType = headers.get("content-type");
  return contentType ? contentType.includes("application/json") : false;
}
