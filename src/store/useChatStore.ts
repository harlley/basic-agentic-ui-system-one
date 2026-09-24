import { create } from "zustand";
import type { UIMessage } from "@/types/chat";

const INITIAL_MESSAGE: UIMessage = {
  id: 1,
  text: "Hi! Let’s find a color. Try “blue”, “Luigi’s color”, “red + yellow”, or “#ff8800”. You can also ask me to suggest a color or tell you the current one.",
  sender: "bot",
};

interface ChatState {
  messages: UIMessage[];
  addMessage: (message: UIMessage) => void;
}

export const useChatStore = create<ChatState>((set) => ({
  messages: [INITIAL_MESSAGE],
  addMessage: (message) =>
    set((state) => ({ messages: [...state.messages, message] })),
}));
