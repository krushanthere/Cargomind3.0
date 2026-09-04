import { apiGet, apiPost } from "@/lib/api/client";

export type ChatLocale = "en" | "hi" | "as";

export interface ChatMessageRequest {
  message: string;
  locale?: ChatLocale;
  context?: Record<string, unknown>;
}

export interface ChatMessageResponse {
  reply: string;
  locale: string;
  step: string;
  intent?: string | null;
  faq_id?: string | null;
  quick_replies: string[];
  draft_shipment?: Record<string, unknown> | null;
  tracked_shipment?: Record<string, unknown> | null;
  hubs?: Array<{ id: string; name: string; type: string }> | null;
  ai_generated?: boolean;
  provider_used?: string | null;
}

export interface ChatStatusResponse {
  status: string;
  provider: string;
  has_server_key: boolean;
  model: string;
}

export async function sendChatMessage(
  payload: ChatMessageRequest
): Promise<ChatMessageResponse> {
  return apiPost<ChatMessageResponse, ChatMessageRequest>("/chat", payload);
}

export async function getChatStatus(): Promise<ChatStatusResponse> {
  return apiGet<ChatStatusResponse>("/chat/status");
}
