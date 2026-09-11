import api from "@/lib/axios";

export type ChatMessageItem = {
  role: "user" | "model";
  text: string;
};

export type ChatAssistantPayload = {
  message: string;
  history?: ChatMessageItem[];
};

export type ChatAssistantResponse = {
  reply: string;
  message?: string;
};

export const aiService = {
  chatWithAssistant: async (
    payload: ChatAssistantPayload
  ): Promise<ChatAssistantResponse> => {
    const response = await api.post<ChatAssistantResponse>(
      "/ai/chat",
      payload
    );
    return response.data;
  },
};

export default aiService;
